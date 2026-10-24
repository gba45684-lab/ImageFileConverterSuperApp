import { initNativeAds, isAndroidNative, maybeShowTestInterstitial, maybeShowTestAppOpen } from './ads.js';
import { initWebAds } from './web-ads.js';
import { downloadLatestAndroidUpdate, installDownloadedAndroidUpdate, hasDownloadedAndroidUpdate, getAndroidUpdateStatus, notifyAndroidUpdate, requestAndroidNotificationPermission, getAndroidAppVersion, saveProcessedFile, isNativeAndroid } from './updater.js';
import packageJson from '../package.json';
import './style.css';
import './design-refresh.css';
import './catalog-refresh.css';
import './settings-refresh.css';
import './workspace-refresh.css';
import './results-refresh.css';
import './responsive-a11y-refresh.css';
import { createIcons, icons } from 'lucide';
import { initGitHubOta } from './ota.js';
import { runPdfTool, PDF_SUITE_TOOLS, PDF_SUITE_PDF_INPUTS } from './pdf-suite.js';
import { showToast, initUiFeedback } from './ui-feedback.js';

const app=document.querySelector('#app');
if(isNativeAndroid()) document.documentElement.classList.add('native-android');
