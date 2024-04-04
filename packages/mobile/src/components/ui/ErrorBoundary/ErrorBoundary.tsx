import React, { ReactNode } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import Clipboard from '@react-native-clipboard/clipboard';

type ErrorBoundaryProps = {
  children: ReactNode;
};
type ErrorBoundaryState = {
  hasError: boolean;
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
      );
    }

    return this.props.children;
  }
}
