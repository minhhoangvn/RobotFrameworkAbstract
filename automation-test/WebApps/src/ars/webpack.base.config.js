var path = require('path')
var webpack = require('webpack')
var SRC_PATH = './arsfe/Pages/'
module.exports = {
    context: __dirname,
    entry: {
        HomePage: SRC_PATH + 'HomePage/index.js',
        LoginPage: SRC_PATH + 'LoginPage/index.js',
        ReportPage: SRC_PATH + 'ReportPage/index.js',
        LoginPageRedux: SRC_PATH + 'LoginPageWithRedux/index.js',
        vendors: ['react'],
    },
    output: {
        path: path.resolve('./Assets/bundles/'),
        filename: '[name].js',
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery'
        }),
        new webpack.ProvidePlugin({
            'fetch': 'imports-loader?this=>global!exports-loader?global.fetch!whatwg-fetch'
        })
    ],
    watch:true,
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                //we definitely don't want babel to transpile all the files in
                //node_modules. That would take a long time.
                exclude: /node_modules/,
                //use the babel loader
                loader: 'babel-loader',
                query: {
                    //specify that we will be dealing with React code
                    presets: ['react']
                }
            },
            {
                test: /\.css/,
                loader: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|jpg)$/,
                loader: ['url-loader'],
            }
        ],
    },
    resolve: {
        //tells webpack where to look for modules
        modules: [
            './node_modules',
            path.resolve('./arsfe')
        ],
        //extensions that should be used to resolve modules
        extensions: ['.', '.js', '.jsx'],
    }
}