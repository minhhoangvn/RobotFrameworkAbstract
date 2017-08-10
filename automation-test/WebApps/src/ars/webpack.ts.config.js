var path = require('path')
var webpack = require('webpack')

module.exports={
    context: __dirname,
      entry: {
    Report:'./arsfe/Report/index.tsx',
    HomePage: './arsfe/HomePage/index.js',
    Navigation:'./arsfe/Navigation/index.js',
    LoginPage:'./arsfe/LoginPage/index.js',
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
            })
        ],
    module:{
        loaders: [
        {
            test: /\.tsx?$/,
                //we definitely don't want babel to transpile all the files in
                //node_modules. That would take a long time.
            exclude: /node_modules/,
                //use the babel loader
            loader: ['babel-loader', 'ts-loader'],
        },
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
            loader:['style-loader', 'css-loader'],
        },
        {
            test: /\.(png|jpg)$/,
            loader:['url-loader'],
        }
            ],
    },
    resolve: {
        //tells webpack where to look for modules
        modules: ['node_modules'],
        //extensions that should be used to resolve modules
        extensions: ['.', '.js', '.jsx','.ts','.tsx']
    },
    devtool:'inline-source-map'
}