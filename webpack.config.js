"use strict";

var path = require('path');

const webpack = require("webpack");

const autoprefixer = require("autoprefixer");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WebpackBuildNotifierPlugin = require('webpack-build-notifier');
const WorkboxPlugin = require('workbox-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest')

const staticFileRegex = /\.(woff|svg|ttf|eot|gif|jpeg|jpg|png)([\?]?.*)$/;

module.exports = {
    mode: 'production',
    entry: {
        app: [
            path.resolve(__dirname, "src/app.tsx"),
            path.resolve(__dirname, "src/app.scss"),
        ],
    },
    output: {
        filename: '[name].bundle.js',
        chunkFilename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: "/",
    },
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: "pre",
                loader: "source-map-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.scss$/,
                use: [{
                    loader: 'style-loader' // creates style nodes from JS strings
                }, {
                    loader: 'css-loader' // translates CSS into CommonJS
                }, {
                    loader: 'resolve-url-loader'
                }, {
                    loader: 'sass-loader', // compiles SCSS to CSS
                    options: {
                        sourceMap: true,
                        sourceMapContents: false
                    }
                }],
                exclude: /node_modules/,
            },
            {
                test: staticFileRegex,
                include: [
                    path.resolve(__dirname, "node_modules"),
                ],
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            name: "[path][name].[ext]",
                        },
                    }
                ]
            },
            {
                test: staticFileRegex,
                include: path.resolve(__dirname, "src"),
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            name: "[name]-[hash].[ext]"
                        },
                    }
                ]
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            minify: {
                collapseWhitespace: true,
            },
            template: path.resolve(__dirname, "src/index.html"),
            title: "Czech Practice",
        }),
        new WebpackBuildNotifierPlugin({
            title: "Czech Practice Build",
        }),
        new webpack.LoaderOptionsPlugin({
            // test: /\.xxx$/, // may apply this only for some modules
            options: {
                postcss: () => {
                    return [
                        autoprefixer({
                            browsers: [
                                "> 1%",
                                "last 2 versions",
                                "Firefox ESR",
                                "Opera 12.1",
                            ],
                        }),
                    ];
                }
            }
        }),
        new WorkboxPlugin.GenerateSW({
            offlineGoogleAnalytics: true,

            // Exclude images from the precache
            exclude: [/\.(?:png|jpg|jpeg|svg)$/],
      
            // Define runtime caching rules.
            runtimeCaching: [{
              // Match any request ends with .png, .jpg, .jpeg or .svg.
              urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
      
              // Apply a cache-first strategy.
              handler: 'CacheFirst',
      
              options: {
                // Use a custom cache name.
                cacheName: 'images',
      
                // Only cache 10 images.
                expiration: {
                  maxEntries: 10,
                },
              },
            }],
        }),
        new WebpackPwaManifest({
            name: "Czech Practice",
            short_name: "Czech",
            description: "Practise Czech grammar and declensions in an interactive app with over 50000 words",
            background_color: '#ffffff',
            theme_color: "#222222",
            start_url: "/?utm_source=a2hs",
            display: "standalone",
            icons: [
                {
                    src: path.resolve("src/assets/favicon_512x512.png"),
                    size: "512x512"
                },
                {
                    src: path.resolve("src/assets/favicon_32x32.png"),
                    size: "32x32"
                }
            ]
          })        
    ]
}
