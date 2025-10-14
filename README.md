# Homebase.id app

Homebase feed and chat app powered by Odin.

<a href='https://play.google.com/store/apps/details?id=id.homebase.feed&pcampaignid=web_share'><img alt='Get it on Google Play' src='https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png' height='80px'/></a>

<p>
&nbsp &nbsp <a href='https://apps.apple.com/in/app/homebase-id/id6468971238'><img alt='Get it on Google Play' src='https://developer.apple.com/news/images/download-on-the-app-store-badge.png' height='54px' width="160px"/></a>
</p>

## Running Locally

In order to get everything running you'll need the back-end web server, see the [Odin](https://github.com/YouFoundation/dotyoucore) repository to get started.

Once you have the back-end running, you can start the mobile app by following the instructions below.

### .npmrc setup for GitHub Packages

If you are installing dependencies for the first time, you may need to create a `.npmrc` file in the project root to authenticate with GitHub Packages:

```bash
echo "@homebase-id:registry=https://npm.pkg.github.com" > .npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> .npmrc
```

Replace `YOUR_GITHUB_TOKEN` with a GitHub personal access token that has at least `read:packages` scope. See [GitHub documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages) for more details.

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

## Contributing

Contributions are highly Welcomed 💙 . Feel free to open PRs for small issues such as typos. For large issues or features, please open an issue and wait for it to be assigned to you.

You can reach out to us on our [Discord](https://id.homebase.id/links) server if you have any questions or need help.

## Communications

Please use the [issue tracker](https://github.com/YouFoundation/feed-mobile-app/issues) on GitHub to report bugs.

## Security Disclosures

If you discover any security issues, please send an email to [info@homebase.id](mailto:info@homebase.id). The email is automatically CCed to the entire team and we'll respond promptly.

## License

This project is licensed under the terms of the AGPL3 license. See the [LICENSE](LICENSE) file.
