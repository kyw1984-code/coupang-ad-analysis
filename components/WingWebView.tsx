import { useRef, useState } from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import type { FileDownloadEvent, WebViewNavigation } from 'react-native-webview/lib/WebViewTypes';
import { useAnalysisStore } from '../stores/useAnalysisStore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/designSystem';

const DEFAULT_WING_URL = 'https://advertising.coupang.com/marketing-reporting/billboard/reports/pa';
const REPORT_PATH = '/marketing-reporting/billboard/reports/pa';
const FIT_REPORT_VIEW_SCRIPT = `
(function () {
  var TARGET_WIDTH = 1120;

  function setViewport() {
    var viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head && document.head.appendChild(viewport);
    }

    viewport.setAttribute(
      'content',
      'width=' + TARGET_WIDTH + ', initial-scale=1, minimum-scale=0.25, maximum-scale=3, user-scalable=yes'
    );
  }

  function relaxHorizontalClipping() {
    var style = document.getElementById('coupang-ad-fit-report-view');
    if (!style) {
      style = document.createElement('style');
      style.id = 'coupang-ad-fit-report-view';
      document.head && document.head.appendChild(style);
    }

    style.textContent = [
      'html, body { overflow-x: auto !important; }',
      'table, [role="table"], .ReactVirtualized__Grid, .ag-root, .ant-table, .table { max-width: none !important; }',
      'button, a, [role="button"] { flex-shrink: 0 !important; }'
    ].join('\\n');
  }

  setViewport();
  relaxHorizontalClipping();
  setTimeout(setViewport, 500);
  setTimeout(relaxHorizontalClipping, 500);
  setTimeout(setViewport, 1500);
  setTimeout(relaxHorizontalClipping, 1500);

  true;
})();
`;

const DOWNLOAD_HELPER_SCRIPT = `
(function () {
  if (window.__coupangAdDownloadHelperInstalled) {
    true;
    return;
  }
  window.__coupangAdDownloadHelperInstalled = true;

  var DOWNLOAD_TEXT = /다운로드|download|excel|엑셀|csv/i;
  var DOWNLOAD_URL = /(download|excel|xlsx|xls|csv|export)/i;
  var FILE_MIME = /spreadsheet|excel|csv|octet-stream|vnd[.]ms-excel|openxmlformats-officedocument/i;
  var NON_FILE_MIME = /application[/]json|text[/]html|image[/]|font[/]/i;
  var CHUNK_SIZE = 120000;
  var DOWNLOAD_TIMEOUT_MS = 15000;
  var DOWNLOAD_INTENT_MS = 45000;
  var objectUrlBlobs = {};
  var lastPostedFileSignature = '';
  var lastPostedFileAt = 0;
  var originalFetch = window.fetch ? window.fetch.bind(window) : null;
  window.__coupangAdExpectingDownloadUntil = 0;

  function isDownloadElement(element) {
    if (!element) return false;
    var text = [
      element.innerText,
      element.textContent,
      element.getAttribute && element.getAttribute('aria-label'),
      element.getAttribute && element.getAttribute('title'),
      element.getAttribute && element.getAttribute('download'),
      element.getAttribute && element.getAttribute('href')
    ].filter(Boolean).join(' ');
    return DOWNLOAD_TEXT.test(text);
  }

  function isDownloadUrl(url) {
    return !!url && DOWNLOAD_URL.test(String(url));
  }

  function isBlobUrl(url) {
    return !!url && String(url).indexOf('blob:') === 0;
  }

  function isSkippableHref(url) {
    return !url || /^#|^javascript:/i.test(String(url).trim());
  }

  function hasFileExtension(value) {
    return /\\.(xlsx|xls|csv)(?:[?#].*)?$/i.test(String(value || ''));
  }

  function isFileMime(contentType) {
    return !!contentType && FILE_MIME.test(String(contentType));
  }

  function markDownloadIntent() {
    window.__coupangAdExpectingDownloadUntil = Date.now() + DOWNLOAD_INTENT_MS;
  }

  window.__coupangAdMarkDownloadIntent = markDownloadIntent;

  function shouldCaptureResponse(url, contentDisposition, contentType) {
    var expected = Date.now() < window.__coupangAdExpectingDownloadUntil;
    var disposition = String(contentDisposition || '');
    var mimeType = String(contentType || '');

    if (/attachment|filename/i.test(disposition)) return true;
    if (hasFileExtension(url) || isDownloadUrl(url)) return true;
    if (expected && isFileMime(mimeType) && !NON_FILE_MIME.test(mimeType)) return true;

    return false;
  }

  function postBlobDownload(blob, filename, mimeType) {
    if (!blob || typeof FileReader === 'undefined') return false;

    var safeFilename = filename || 'wing-report-' + Date.now() + (String(mimeType || blob.type).indexOf('csv') >= 0 ? '.csv' : '.xlsx');
    if (!hasFileExtension(safeFilename)) {
      safeFilename += String(mimeType || blob.type).indexOf('csv') >= 0 ? '.csv' : '.xlsx';
    }
    var signature = [safeFilename, blob.size, mimeType || blob.type || ''].join('|');
    var now = Date.now();

    if (signature === lastPostedFileSignature && now - lastPostedFileAt < 8000) {
      return true;
    }

    lastPostedFileSignature = signature;
    lastPostedFileAt = now;
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'download-start' }));

    var reader = new FileReader();
    reader.onerror = function () {
      postDownloadError('파일을 읽는 중 오류가 발생했습니다.');
    };
    reader.onloadend = function () {
      var dataUrl = String(reader.result || '');
      var base64 = dataUrl.indexOf(',') >= 0 ? dataUrl.split(',')[1] : dataUrl;
      var id = String(Date.now()) + '-' + Math.random().toString(16).slice(2);
      var total = Math.ceil(base64.length / CHUNK_SIZE);

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'download-meta',
        id: id,
        filename: safeFilename,
        mimeType: mimeType || blob.type || 'application/octet-stream',
        total: total
      }));

      for (var index = 0; index < total; index += 1) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'download-chunk',
          id: id,
          index: index,
          chunk: base64.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE)
        }));
      }
    };
    reader.readAsDataURL(blob);
    return true;
  }

  function captureFetchResponse(response, url) {
    if (!response || !response.headers) return;

    var contentDisposition = response.headers.get('content-disposition') || '';
    var contentType = response.headers.get('content-type') || '';
    if (!shouldCaptureResponse(url, contentDisposition, contentType)) return;

    var filename = guessFilename(url || '', contentDisposition);
    response.clone().blob().then(function (blob) {
      postBlobDownload(blob, filename, contentType);
    }).catch(function () {});
  }

  function tryDownloadUrl(url, force, filename) {
    if (!url) return false;

    if (isBlobUrl(url)) {
      var blob = objectUrlBlobs[String(url)];
      if (blob) {
        markDownloadIntent();
        return postBlobDownload(blob, filename || guessFilename(url, ''), blob.type);
      }
    }

    if (!force && !isDownloadUrl(url)) return false;
    markDownloadIntent();
    window.__coupangAdDownloadFile(url, filename);
    return true;
  }

  function guessFilename(url, contentDisposition) {
    var fallback = 'wing-report-' + Date.now() + '.xlsx';
    if (contentDisposition) {
      var utfMatch = contentDisposition.match(/filename\\*=UTF-8''([^;]+)/i);
      if (utfMatch && utfMatch[1]) return decodeURIComponent(utfMatch[1].replace(/"/g, ''));
      var plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      if (plainMatch && plainMatch[1]) return plainMatch[1];
    }
    try {
      var pathname = new URL(url, window.location.href).pathname;
      var name = pathname.split('/').pop();
      if (name && /\\.(xlsx|xls|csv)$/i.test(name)) return decodeURIComponent(name);
    } catch (error) {}
    return fallback;
  }

  function postDownloadError(message) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'download-error',
      message: message || '파일을 앱으로 저장하지 못했습니다.'
    }));
  }

  window.__coupangAdDownloadFile = function (url, preferredFilename) {
    var absoluteUrl;
    try {
      absoluteUrl = new URL(url, window.location.href).toString();
    } catch (error) {
      postDownloadError('다운로드 주소를 읽지 못했습니다.');
      return;
    }

    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'download-start' }));

    var fetcher = originalFetch || window.fetch;
    if (!fetcher) {
      postDownloadError('다운로드 요청을 실행할 수 없습니다.');
      return;
    }

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutId = setTimeout(function () {
      if (controller) controller.abort();
      postDownloadError('자동 저장 시간이 초과되었습니다.');
    }, DOWNLOAD_TIMEOUT_MS);

    fetcher(absoluteUrl, {
      credentials: 'include',
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        clearTimeout(timeoutId);
        var filename = preferredFilename || guessFilename(absoluteUrl, response.headers.get('content-disposition'));
        var mimeType = response.headers.get('content-type') || 'application/octet-stream';
        return response.blob().then(function (blob) {
          postBlobDownload(blob, filename, mimeType);
        });
      })
      .catch(function (error) {
        clearTimeout(timeoutId);
        if (error && error.name === 'AbortError') return;
        postDownloadError(error && error.message ? error.message : '다운로드 요청이 실패했습니다.');
      });
  };

  if (originalFetch) {
    window.fetch = function (input, init) {
      var requestUrl = typeof input === 'string' ? input : input && input.url;
      return originalFetch(input, init).then(function (response) {
        try {
          captureFetchResponse(response, requestUrl);
        } catch (error) {}
        return response;
      });
    };
  }

  if (window.XMLHttpRequest && window.XMLHttpRequest.prototype) {
    var originalXHROpen = window.XMLHttpRequest.prototype.open;
    var originalXHRSend = window.XMLHttpRequest.prototype.send;

    window.XMLHttpRequest.prototype.open = function (method, requestUrl) {
      this.__coupangAdRequestUrl = requestUrl;
      return originalXHROpen.apply(this, arguments);
    };

    window.XMLHttpRequest.prototype.send = function () {
      var xhr = this;
      xhr.addEventListener('load', function () {
        try {
          var requestUrl = xhr.__coupangAdRequestUrl || xhr.responseURL || '';
          var absoluteUrl = requestUrl ? new URL(requestUrl, window.location.href).toString() : '';
          var contentDisposition = xhr.getResponseHeader('content-disposition') || '';
          var contentType = xhr.getResponseHeader('content-type') || '';

          if (!shouldCaptureResponse(absoluteUrl, contentDisposition, contentType)) return;

          var response = xhr.response;
          var blob = null;
          if (response instanceof Blob) {
            blob = response;
          } else if (response instanceof ArrayBuffer) {
            blob = new Blob([response], { type: contentType || 'application/octet-stream' });
          } else if (typeof response === 'string') {
            blob = new Blob([response], { type: contentType || 'text/csv' });
          }

          if (blob) {
            postBlobDownload(blob, guessFilename(absoluteUrl, contentDisposition), contentType || blob.type);
          }
        } catch (error) {}
      });
      return originalXHRSend.apply(this, arguments);
    };
  }

  if (window.URL && window.URL.createObjectURL) {
    var originalCreateObjectURL = window.URL.createObjectURL.bind(window.URL);
    window.URL.createObjectURL = function (object) {
      var objectUrl = originalCreateObjectURL(object);
      if (object instanceof Blob) {
        objectUrlBlobs[objectUrl] = object;
      }
      return objectUrl;
    };
  }

  var originalWindowOpen = window.open;
  window.open = function (url) {
    var force = Date.now() < window.__coupangAdExpectingDownloadUntil;
    if (tryDownloadUrl(url, force)) {
      return null;
    }

    return originalWindowOpen.apply(window, arguments);
  };

  if (window.HTMLAnchorElement && window.HTMLAnchorElement.prototype) {
    var originalAnchorClick = window.HTMLAnchorElement.prototype.click;
    window.HTMLAnchorElement.prototype.click = function () {
      var href = this && this.href;
      var rawHref = this && this.getAttribute && this.getAttribute('href');
      var hasDownloadAttribute = this && this.hasAttribute && this.hasAttribute('download');
      var downloadName = this && this.getAttribute && this.getAttribute('download');

      if (!isSkippableHref(rawHref) && (hasDownloadAttribute || isBlobUrl(href) || isDownloadUrl(href)) && tryDownloadUrl(href, hasDownloadAttribute || isBlobUrl(href), downloadName)) {
        return;
      }

      return originalAnchorClick.apply(this, arguments);
    };
  }

  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest
      ? event.target.closest('button,a,[role="button"],input')
      : event.target;
    if (isDownloadElement(target)) {
      markDownloadIntent();
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'download-click' }));
      var link = target && target.closest ? target.closest('a[href]') : null;
      var href = target && target.href ? target.href : link && link.href;
      var rawHref = target && target.getAttribute && target.getAttribute('href')
        ? target.getAttribute('href')
        : link && link.getAttribute && link.getAttribute('href');
      var downloadName = target && target.getAttribute && target.getAttribute('download');
      if (!isSkippableHref(rawHref) && href && tryDownloadUrl(href, true, downloadName)) {
        event.preventDefault();
      }
    }
  }, true);

  true;
})();
`;

const WEBVIEW_INJECTED_SCRIPT = `
${FIT_REPORT_VIEW_SCRIPT}
${DOWNLOAD_HELPER_SCRIPT}
true;
`;

const DOWNLOAD_URL_PATTERN = /(download|excel|xlsx|xls|csv|export)/i;

interface DownloadAssembly {
  filename: string;
  mimeType?: string;
  total: number;
  chunks: string[];
}

interface DownloadRequest {
  url: string;
  timestamp: number;
}

interface WingWebViewProps {
  onFileDownload?: (filePath: string, filename: string) => void;
  url?: string;
}

export default function WingWebView({ onFileDownload, url = DEFAULT_WING_URL }: WingWebViewProps) {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const downloadsRef = useRef<Record<string, DownloadAssembly>>({});
  const downloadFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDownloadRequestRef = useRef<DownloadRequest | null>(null);
  const { setUploadedFile } = useAnalysisStore();
  const [webViewUrl, setWebViewUrl] = useState(url);
  const [webViewKey, setWebViewKey] = useState(0);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [loading, setLoading] = useState(true);
  const [pickingFile, setPickingFile] = useState(false);
  const [savingDownload, setSavingDownload] = useState(false);
  const [downloadTouched, setDownloadTouched] = useState(false);

  const clearDownloadFallbackTimer = () => {
    if (downloadFallbackTimerRef.current) {
      clearTimeout(downloadFallbackTimerRef.current);
      downloadFallbackTimerRef.current = null;
    }
  };

  const scheduleDownloadFallback = () => {
    clearDownloadFallbackTimer();
    downloadFallbackTimerRef.current = setTimeout(() => {
      setSavingDownload(false);
      Alert.alert(
        '자동 저장 대기 중',
        '쿠팡에서 파일 주소를 앱에 전달하지 않았습니다. 다운로드가 완료되었거나 멈춘 경우 파일 가져오기로 보고서를 선택해 주세요.',
        [{ text: '파일 가져오기', onPress: handlePickFile }, { text: '닫기', style: 'cancel' }]
      );
    }, 45000);
  };

  const isLikelyDownloadUrl = (targetUrl: string) => DOWNLOAD_URL_PATTERN.test(targetUrl);
  const isOnReportPage = currentUrl.includes(REPORT_PATH);

  const shouldSkipDuplicateDownload = (downloadUrl: string) => {
    const now = Date.now();
    const urlKey = downloadUrl.trim();
    const previous = lastDownloadRequestRef.current;

    if (previous && previous.url === urlKey && now - previous.timestamp < 8000) {
      return true;
    }

    lastDownloadRequestRef.current = { url: urlKey, timestamp: now };
    return false;
  };

  const goToReportUrl = () => {
    setWebViewUrl(DEFAULT_WING_URL);
    setCurrentUrl(DEFAULT_WING_URL);
    setWebViewKey((key) => key + 1);
  };

  const handlePickFile = async () => {
    try {
      setPickingFile(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
          'text/comma-separated-values',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (!file) {
        Alert.alert('오류', '파일을 선택할 수 없습니다.');
        return;
      }

      setUploadedFile({ name: file.name, uri: file.uri });
      onFileDownload?.(file.uri, file.name);

      Alert.alert(
        '파일 선택 완료',
        `"${file.name}"\n분석 탭으로 이동합니다.`,
        [{ text: '확인', onPress: () => router.push('/(tabs)/analyze') }]
      );
    } catch (err) {
      console.error('File pick error:', err);
      Alert.alert('오류', '파일을 선택하는 중 오류가 발생했습니다.');
    } finally {
      setPickingFile(false);
    }
  };

  const sanitizeFilename = (filename: string, mimeType?: string) => {
    const trimmed = filename.trim() || `wing-report-${Date.now()}.xlsx`;
    const withExtension = /\.(xlsx|xls|csv)$/i.test(trimmed)
      ? trimmed
      : `${trimmed}${mimeType?.toLowerCase().includes('csv') ? '.csv' : '.xlsx'}`;

    return withExtension.replace(/[\\/:*?"<>|]/g, '_');
  };

  const saveDownloadedFile = async (filename: string, base64: string, mimeType?: string) => {
    clearDownloadFallbackTimer();
    const safeName = sanitizeFilename(filename, mimeType);
    const fileUri = `${FileSystem.cacheDirectory}${safeName}`;

    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    setUploadedFile({ name: safeName, uri: fileUri });
    onFileDownload?.(fileUri, safeName);
    setSavingDownload(false);
    router.push(`/(tabs)/analyze?autoAnalyze=1&downloadedAt=${Date.now()}`);
  };

  const requestInWebViewDownload = (downloadUrl: string) => {
    if (shouldSkipDuplicateDownload(downloadUrl)) {
      return;
    }

    setDownloadTouched(true);
    setSavingDownload(true);
    scheduleDownloadFallback();
    webViewRef.current?.injectJavaScript(`
      window.__coupangAdDownloadFile && window.__coupangAdDownloadFile(${JSON.stringify(downloadUrl)});
      true;
    `);
  };

  const handleFileDownload = (event: FileDownloadEvent) => {
    setDownloadTouched(true);
    const downloadUrl = event.nativeEvent.downloadUrl;

    if (downloadUrl) {
      requestInWebViewDownload(downloadUrl);
      return;
    }

    Alert.alert('다운로드 확인', '저장이 완료되면 파일 가져오기로 방금 받은 보고서를 선택해 주세요.', [
      { text: '닫기', style: 'cancel' },
      { text: '파일 가져오기', onPress: handlePickFile },
    ]);
  };

  const handleMessage = async (event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        id?: string;
        filename?: string;
        mimeType?: string;
        total?: number;
        index?: number;
        chunk?: string;
        message?: string;
      };
      if (message.type === 'download-action-result') {
        if (message.message === 'clicked') {
          setDownloadTouched(true);
          scheduleDownloadFallback();
          return;
        }

        Alert.alert('다운로드 버튼 없음', '현재 화면에서 쿠팡 다운로드 버튼을 찾지 못했습니다. 리포트가 생성 완료 상태인지 확인한 뒤 다시 눌러주세요.');
        return;
      }
      if (message.type === 'download-click') {
        setDownloadTouched(true);
        scheduleDownloadFallback();
      }
      if (message.type === 'download-start') {
        clearDownloadFallbackTimer();
        setDownloadTouched(true);
        setSavingDownload(true);
      }
      if (
        message.type === 'download-meta' &&
        message.id &&
        message.filename &&
        typeof message.total === 'number'
      ) {
        downloadsRef.current[message.id] = {
          filename: message.filename,
          mimeType: message.mimeType,
          total: message.total,
          chunks: new Array<string>(message.total),
        };
      }
      if (
        message.type === 'download-chunk' &&
        message.id &&
        typeof message.index === 'number' &&
        typeof message.chunk === 'string'
      ) {
        const download = downloadsRef.current[message.id];
        if (!download) return;

        download.chunks[message.index] = message.chunk;
        const receivedCount = download.chunks.filter(Boolean).length;

        if (receivedCount === download.total) {
          const base64 = download.chunks.join('');
          delete downloadsRef.current[message.id];
          await saveDownloadedFile(download.filename, base64, download.mimeType);
        }
      }
      if (message.type === 'download-error') {
        clearDownloadFallbackTimer();
        setSavingDownload(false);
        Alert.alert(
          '앱 저장 실패',
          `${message.message || '다운로드 파일을 앱으로 가져오지 못했습니다.'}\n아래 파일 가져오기로 저장된 파일을 직접 선택해 주세요.`,
          [{ text: '파일 가져오기', onPress: handlePickFile }, { text: '닫기', style: 'cancel' }]
        );
      }
    } catch {
      return;
    }
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCurrentUrl(navState.url);
    const lowerUrl = navState.url.toLowerCase();
    if (isLikelyDownloadUrl(lowerUrl)) {
      setDownloadTouched(true);
    }
  };

  const handleShouldStartLoad = (request: { url: string }) => {
    if (isLikelyDownloadUrl(request.url)) {
      requestInWebViewDownload(request.url);
      return false;
    }

    return true;
  };

  const executeReportDownload = () => {
    setDownloadTouched(true);
    webViewRef.current?.injectJavaScript(`
      (function () {
        function postResult(message) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'download-action-result',
            message: message
          }));
        }

        function textOf(element) {
          return [
            element.innerText,
            element.textContent,
            element.getAttribute && element.getAttribute('aria-label'),
            element.getAttribute && element.getAttribute('title')
          ].filter(Boolean).join(' ').replace(/\\s+/g, ' ').trim();
        }

        function isUsable(element) {
          if (!element) return false;
          var rect = element.getBoundingClientRect();
          var disabled = element.disabled ||
            element.getAttribute('disabled') !== null ||
            element.getAttribute('aria-disabled') === 'true';
          return rect.width > 0 && rect.height > 0 && !disabled;
        }

        function closestClickable(element) {
          return element && element.closest
            ? element.closest('button,a,[role="button"],input[type="button"],input[type="submit"]')
            : element;
        }

        function findScrollableParent(element) {
          var current = element;
          while (current && current !== document.body && current !== document.documentElement) {
            if (current.scrollWidth > current.clientWidth + 40) return current;
            current = current.parentElement;
          }
          return null;
        }

        function fireClick(element) {
          var clickable = closestClickable(element) || element;
          if (!clickable || !isUsable(clickable)) return false;

          var scroller = findScrollableParent(clickable);
          if (scroller) {
            scroller.scrollLeft = Math.max(scroller.scrollLeft, clickable.offsetLeft - scroller.clientWidth + clickable.offsetWidth + 24);
          }

          if (clickable.scrollIntoView) {
            clickable.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
          }

          if (window.__coupangAdMarkDownloadIntent) {
            window.__coupangAdMarkDownloadIntent();
          }

          if (typeof clickable.click === 'function') {
            clickable.click();
          } else {
            clickable.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            }));
          }

          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'download-click' }));
          return true;
        }

        var elements = Array.prototype.slice.call(
          document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"],td,span,div')
        );

        var chartButton = elements.find(function (element) {
          return isUsable(element) && /차트\\s*보기/.test(textOf(element));
        });

        if (chartButton) {
          var row = chartButton.closest && (
            chartButton.closest('tr') ||
            chartButton.closest('[role="row"]') ||
            chartButton.closest('li') ||
            chartButton.parentElement
          );

          var rowButtons = row
            ? Array.prototype.slice.call(row.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]'))
            : [];
          var chartRect = chartButton.getBoundingClientRect();
          var neighborDownload = rowButtons.find(function (button) {
            var rect = button.getBoundingClientRect();
            return isUsable(button) &&
              rect.left > chartRect.left + 8 &&
              /다운로드|download|excel|엑셀|csv/i.test(textOf(button));
          }) || rowButtons.find(function (button) {
            var rect = button.getBoundingClientRect();
            return isUsable(button) && rect.left > chartRect.left + 8;
          });

          if (neighborDownload && fireClick(neighborDownload)) {
            postResult('clicked');
            return true;
          }
        }

        var directDownload = elements
          .map(function (element) { return closestClickable(element); })
          .filter(function (element, index, array) { return element && array.indexOf(element) === index; })
          .find(function (element) {
            return isUsable(element) && /다운로드|download|excel|엑셀|csv/i.test(textOf(element));
          });

        if (directDownload && fireClick(directDownload)) {
          postResult('clicked');
          return true;
        }

        postResult('not-found');
        return true;
      })();
      true;
    `);
  };

  return (
    <View style={styles.container}>
      <View style={styles.webViewFrame}>
        <WebView
          key={webViewKey}
          ref={webViewRef}
          source={{ uri: webViewUrl }}
          style={styles.webView}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures
          startInLoadingState
          scalesPageToFit
          injectedJavaScript={WEBVIEW_INJECTED_SCRIPT}
          injectedJavaScriptBeforeContentLoaded={WEBVIEW_INJECTED_SCRIPT}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onMessage={handleMessage}
          onFileDownload={handleFileDownload}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onError={() => setLoading(false)}
        />
        <TouchableOpacity
          style={styles.reloadButton}
          onPress={goToReportUrl}
          activeOpacity={0.8}
        >
          <Text style={styles.reloadButtonText}>리포트 이동</Text>
        </TouchableOpacity>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={COLORS.primary[600]} />
            <Text style={styles.loadingText}>WING을 불러오는 중입니다</Text>
          </View>
        )}
        {savingDownload && (
          <View style={styles.downloadOverlay}>
            <ActivityIndicator color={COLORS.text.inverse} />
            <Text style={styles.downloadOverlayText}>보고서를 앱에 저장하는 중입니다</Text>
          </View>
        )}
      </View>

      <View style={styles.importPanel}>
        <View style={styles.importCopy}>
          <Text style={styles.importTitle}>
            {isOnReportPage ? '리포트 다운로드' : '리포트 주소로 이동 필요'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={goToReportUrl}
          activeOpacity={0.85}
        >
          <Text style={styles.reportButtonText}>이동</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.importButton}
          onPress={executeReportDownload}
          disabled={pickingFile || savingDownload}
          activeOpacity={0.85}
        >
          {pickingFile || savingDownload ? (
            <ActivityIndicator color={COLORS.text.inverse} />
          ) : (
            <Text style={styles.importButtonText}>다운로드 클릭</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  reloadButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    minHeight: 34,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  reloadButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as never,
    color: COLORS.text.primary,
  },
  webViewFrame: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  webView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
  },
  downloadOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },
  downloadOverlayText: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as never,
    color: COLORS.text.inverse,
  },
  importPanel: {
    position: 'absolute',
    left: SPACING.sm,
    right: SPACING.sm,
    bottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary[500],
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  importCopy: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  importTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold as never,
    color: COLORS.text.primary,
  },
  panButton: {
    width: 36,
    minHeight: 36,
    marginRight: SPACING.xs,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  panButtonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold as never,
  },
  reportButton: {
    minHeight: 36,
    paddingHorizontal: SPACING.sm,
    marginRight: SPACING.xs,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reportButtonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as never,
  },
  importButton: {
    minHeight: 36,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[600],
  },
  importButtonText: {
    color: COLORS.text.inverse,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as never,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
