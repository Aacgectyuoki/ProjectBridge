/** @type {import('next').NextConfig} */

// This file sets up Sentry for Next.js
const { withSentryConfig } = require("@sentry/nextjs")

const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/ProjectBridge' : '',
  images: {
    unoptimized: true,
  },
  // output: 'export',
  // reactStrictMode: true,
  // swcMinify: true,
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  // images: {
  //   unoptimized: true,
  // },
  // Your existing Next.js config
}

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore
  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
}

// Make sure adding Sentry options is the last code to run before exporting
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions)
