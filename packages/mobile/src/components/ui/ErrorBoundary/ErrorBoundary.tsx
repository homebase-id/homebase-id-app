import React, { ReactNode } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import Clipboard from '@react-native-clipboard/clipboard';

// import { ActionButton } from '../Buttons/ActionButton';
// import { Arrow } from '../Icons/Arrow';
// import { Refresh } from '../Icons/Refresh';
// import { Clipboard } from '../Icons/Clipboard';

type ErrorBoundaryProps = {
  children: ReactNode; // like this
};
type ErrorBoundaryState = {
  hasError: boolean; // like this
  showDetails: boolean;
  errorTitle?: string;
  details?: unknown;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, showDetails: false };
  }

  static getDerivedStateFromError(_error: object) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorTitle: _error.toString() };
  }

  componentDidCatch(_error: unknown, errorInfo: unknown) {
    this.setState({ hasError: true, details: errorInfo });
    // You can also log the error to an error reporting service
    //   logErrorToMyService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const detailText = (() => {
        try {
          return [
            this.state.errorTitle,
            this.state.details &&
            typeof this.state.details === 'object' &&
            'componentStack' in this.state.details &&
            this.state.details.componentStack
              ? this.state.details?.componentStack.toString()
              : this.state.details
              ? (this.state.details as object).toString()
              : '',
          ].join();
        } catch (e) {
          return 'Unknown error';
        }
      })();

      return (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 20 }}>Oops, that&apos;s an error.</Text>
            <Text>Something went wrong while rendering this component.</Text>
            <View style={{ marginTop: 5 }}>
              <Button
                title={this.state.showDetails ? 'Less' : 'More information'}
                onPress={() =>
                  this.setState({ ...this.state, showDetails: !this.state.showDetails })
                }
              />
            </View>
          </View>
          {this.state.showDetails ? (
            <View>
              <ScrollView>
                <Text>{detailText}</Text>
                <View>
                  <Button
                    title="Copy"
                    onPress={() => {
                      if (detailText) {
                        Clipboard.setString(detailText);
                        Toast.show({
                          text1: 'Copied to Clipboard',
                          type: 'success',
                          visibilityTime: 2000,
                          position: 'bottom',
                        });
                      }
                    }}
                  />
                </View>
              </ScrollView>
            </View>
          ) : null}
        </View>

        // <div className="p-5 flex flex-col gap-2">
        //   <h1 className="text-xl">Oops, that&apos;s an error.</h1>
        //   <p>Something went wrong while rendering this component.</p>
        //   <div className="mt-5 flex flex-row justify-between">
        //     <ActionButton
        //       onClick={() => window.location.reload()}
        //       className="flex flex-row items-center gap-2 hover:underline"
        //       type="secondary"
        //     >
        //       Retry <Refresh className="h-4 w-4" />{' '}
        //     </ActionButton>

        //     <button
        //       onClick={() => this.setState({ ...this.state, showDetails: !this.state.showDetails })}
        //       className="flex flex-row items-center gap-2 hover:underline"
        //     >
        //       {this.state.showDetails ? 'Less' : 'More'} information <Arrow className="h-4 w-4" />
        //     </button>
        //   </div>
        //   {this.state.showDetails ? (
        //     <>
        //       <div className="overflow-auto">
        //         <pre>
        //           <code>{detailText}</code>
        //         </pre>
        //       </div>
        //       <div className="flex flex-row-reverse">
        //         <ActionButton
        //           onClick={() => {
        //             detailText && navigator.clipboard.writeText(detailText);
        //           }}
        //           type="secondary"
        //           icon={Clipboard}
        //         >
        //           Copy
        //         </ActionButton>
        //       </div>
        //     </>
        //   ) : null}
        // </div>
      );
    }

    return this.props.children;
  }
}
