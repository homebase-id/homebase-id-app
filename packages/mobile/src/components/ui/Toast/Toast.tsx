import Toast, { ToastConfig, ToastConfigParams } from 'react-native-toast-message';
import { ErrorToast } from './ErrorToast';
import { SuccessToast } from './SuccessToast';
import { InfoToast } from './InfoToast';
import { NotificationToast, NotificationToastProps } from './NotificationToast';

const config: ToastConfig = {
  success: (props) => <SuccessToast {...props} />,
  info: (props) => <InfoToast {...props} />,
  error: (props) => <ErrorToast {...props} />,
  notification: (props: ToastConfigParams<NotificationToastProps>) => (
    <NotificationToast {...props} />
  ),
};

const OurToast = () => {
  return <Toast config={config} />;
};

export { OurToast as Toast };
