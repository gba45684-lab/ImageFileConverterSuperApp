import { initNativeAds, maybeShowTestInterstitial } from './ads.js';
import { downloadLatestAndroidUpdate, installDownloadedAndroidUpdate, hasDownloadedAndroidUpdate, getAndroidUpdateStatus, notifyAndroidUpdate, requestAndroidNotificationPermission, getAndroidAppVersion, isNativeAndroid, saveProcessedFile } from './updater.js';
import packageJson from '../package.json';
import './style.css';
import './design-refresh.css';
import './catalog-refresh.css';
import './settings-refresh.css';
import './workspace-refresh.css';
import './results-refresh.css';
import { createIcons, icons } from 'lucide';
import { initGitHubOta } from './ota.js';

const app=document.querySelector('#app');