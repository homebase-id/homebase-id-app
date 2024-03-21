# react-native-template

Template Repo for React Native apps with youauth integration

## Log in as `frodo.dotyou.cloud` on Android

```
# run adb as root:
adb root

# adb proxy port 443
adb reverse tcp:443 tcp:443
```

Now you can login with `frodo.dotyou.cloud`.

# metro debug level

export METRO_LOG_LEVEL=debug
npm start
