# Homebase Feed Mobile

Homebase feed and chat app powered by Odin.


<a href='https://play.google.com/store/apps/details?id=id.homebase.feed&pcampaignid=web_share'><img alt='Get it on Google Play' src='https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png' height='80px'/></a> 

<p>
&nbsp &nbsp <a href='https://apps.apple.com/in/app/homebase-id/id6468971238'><img alt='Get it on Google Play' src='https://developer.apple.com/news/images/download-on-the-app-store-badge.png' height='54px' width="160px"/></a>
</p>


## Running Locally

In order to get everything running you'll need the back-end web server, see the [Odin](https://github.com/YouFoundation/dotyoucore) repository to get started.

Once you have the back-end running, you can start the mobile app by following the instructions below.

### Install dependencies

```bash
npm install
```

### Start Metro

```bash
npm start
```

#### Log in with local identities on Android

```
# run adb as root:
adb root

# adb proxy port 443
adb reverse tcp:443 tcp:443
```

Now you can log in with local identities such as `frodo.dotyou.cloud`.

> [!Note]
> No Such configuration is required for iOS simulators.

## Communications

Please use the [issue tracker](https://github.com/YouFoundation/feed-mobile-app/issues) on GitHub to report bugs.

## Security Disclosures

If you discover any security issues, please send an email to [security@homebase.id](mailto:security@homebase.id). The email is automatically CCed to the entire team and we'll respond promptly.

## License

This project is licensed under the terms of the AGPL3 license. See the [LICENSE](LICENSE) file.
