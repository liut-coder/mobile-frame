import { createMockNativeModules } from '@mobile-frame/ui-native/native-modules';

const adminNativeModules = createMockNativeModules({
  scannedQRCodes: [{ format: 'qr', value: 'mf-bind://device/DEV-1024' }]
});

export const adminNativeActions = {
  browser: {
    open: (url: string) => adminNativeModules.browser.open(url)
  },
  clipboard: {
    copy: (text: string) => adminNativeModules.clipboard.copy(text)
  },
  scanner: {
    scanQRCode: () => adminNativeModules.scanner.scanQRCode()
  },
  share: {
    shareFile: (path: string) => adminNativeModules.share.shareFile(path),
    shareText: (text: string) => adminNativeModules.share.shareText(text)
  }
};
