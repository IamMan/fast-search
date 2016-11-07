# fast-search

This is a simple implementation of client side text search in JavaScript. It uses a linear search, and though it can be extended to use other search engines( e.g. trigrams), it is already fast enough. 

You can configure case sensitivity by 'globalConfigs' object's IGNORE_CASE parameter. By default it ignores case.
    
There is a big(~50k) products data set. You can turn it on by replacing 'products.js' to 'big_products.js' on line 40 in index.html