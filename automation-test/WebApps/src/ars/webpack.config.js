var path = require('path')
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')

module.exports={
    context: __dirname,
    entry: {
        HomePage: './ars_front_end/HomePage/index.js',
        vendors: ['react'],
  },
    output: {
        path: path.resolve('./Assets/bundles/'),
        filename: '[name]-[hash].js',
    },
plugins: [
        new BundleTracker({filename: './webpack-stats-local.json'}),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery'
        })
    ],
    resolve: {
        //tells webpack where to look for modules
        modules: ['node_modules'],
        //extensions that should be used to resolve modules
        extensions: [".", ".ts", ".js", ".jsx"]
    },
    module: {
        loaders: [
            //a regexp that tells webpack use the following loaders on all 
            //.js and .jsx files
            {test: /\.jsx?$/, 
                //we definitely don't want babel to transpile all the files in 
                //node_modules. That would take a long time.
                exclude: /node_modules/, 
                //use the babel loader 
                loader: 'babel-loader', 
                query: {
                    //specify that we will be dealing with React code
                    presets: ['react'] 
                }
            }
        ]
    }
}