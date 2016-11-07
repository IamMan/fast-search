/**
 * Created by iamaman on 01.11.16.
 */

var globalConfigs = {
    SEARCH_DELAY : 100,
    HEIGHT_SCROLL_OFFSET : 300,
    VISIBLE_ADD_BATCH: 30,
    IGNORE_CASE: true
};

var configs = new function() {
    this.SEARCH_INPUT_ID = "search";
    this.SEARCH_RESULTS_DIV_CLASS = "results";
    this.PRODUCTS_DIV_CLASS = "products";
};

function SearchBoxController(selector, products, results, searchEngine) {
    var searchBox = document.getElementsByClassName(selector)[0];
    this.searchBox = searchBox;
    this.searchEngine = searchEngine;
    this.searchEngine.initialize(products.products);
    this.currentSearchIterator = null;
    this.currentProductsIterator = null;
    this.currentSearchValue = "";
    this.currentIterableCount = 0;

    this.productsController = products;
    this.resultsController = results;

    this.previousIntervalId = 0;

    var self = this;

    self.previousIntervalId = 0;

    function makeIterator(array){
        var nextIndex = 0;

        return {
            next: function(){
                return nextIndex < array.length ?
                {value: array[nextIndex++], done: false} :
                {done: true};
            }
        }
    }

    this.hideResults = function () {
        self.resultsController.hide();
        self.productsController.show();

        self.currentProductsIterator = makeIterator(self.productsController.products);
        self.iterateProducts();
        window.addEventListener("scroll", self.iterateProducts);
    };

    this.showResults = function () {
        self.productsController.hide();
        self.resultsController.show();

        self.currentProductsIterator = null;
        window.removeEventListener("scroll", self.iterateProducts);
    };

    searchBox.addEventListener("input", function () {
        if (self.previousIntervalId != 0) clearTimeout(self.previousIntervalId);
        self.previousIntervalId = setTimeout(self.makeSearch, globalConfigs.SEARCH_DELAY)
    });

    this.makeSearch = function () {
        self.cleanSearch();
        if (self.searchBox.value.length > 0) {
            if (self.currentSearchValue.length == 0) self.showResults();
            self.currentSearchValue = self.searchBox.value;
            self.currentSearchIterator = self.searchEngine.makeIterator(self.currentSearchValue, globalConfigs.IGNORE_CASE);
            window.addEventListener("scroll", self.iterateSearch);
            self.iterateSearch()
        } else {
            self.hideResults()
        }
    };

    this.cleanSearch = function () {
        self.currentSearchIterator = null;
        self.currentSearchValue = "";
        window.removeEventListener("scroll", self.iterateSearch);
        self.resultsController.element.innerHTML = "";
        self.previousIntervalId = 0;
        self.currentIterableCount = 0;
    };

    this.iterateSearch = function () {
        self.iterateController(self.resultsController, self.currentSearchIterator, self.currentSearchValue)
    };

    this.iterateProducts = function () {
        self.iterateController(self.productsController, self.currentProductsIterator, "")
    };

    this.iterateController = function (controller, iterator, highlightedText) {
        if (controller.isVisibleFull()) {
            return;
        }
        var current = iterator.next();
        var batchLast = globalConfigs.VISIBLE_ADD_BATCH;
        while (!current.done && batchLast > 0) {
            controller.addProductHighlighted(current.value, highlightedText);
            batchLast--;
            current = iterator.next();
        }
    };

    this.hideResults()
}

function ProductsController(selector, initialProducts) {
    var element = document.getElementsByClassName(selector)[0];
    this.element = element;

    var products = [];
    this.products = products;

    var self = this;

    function preg_quote( str ) {
        return (str+'').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
    }

    this.addProductHighlighted = function (product, text) {
        products.push(product);

        var regexParams = '';
        if (globalConfigs.IGNORE_CASE) regexParams = 'gi';
        else regexParams = 'g';

        var productTitle = product.title.replace(new RegExp( "(" + preg_quote( text ) + ")",  regexParams), "<span style=\"background-color: yellow;\">$1</span>");
        var productDescription = product.description;
        self.addToDom(productTitle, productDescription);
    };

    this.addToDom = function (productTitle, productDescription) {

        var elem = "<div class='product panel panel-default'>" +
            "<div class='title panel-heading'>" + productTitle + "</div>" +
            "<div class='description panel-body'>" + productDescription + "</div>" +
            "</div>";
        self.element.insertAdjacentHTML('beforeend', elem);
    };

    this.hide = function () {
        element.classList.add("hidden")
    };

    this.show = function () {
        element.classList.remove("hidden")
    };

    this.isVisibleFull = function () {
        var windowViewTop = window.pageYOffset;
        var windowViewBottom = windowViewTop + window.innerHeight;

        var docHeight = document.documentElement.offsetHeight;

        return windowViewBottom + globalConfigs.HEIGHT_SCROLL_OFFSET < docHeight;
    };

    this.products = initialProducts
}

var simpleSearchEngine;
simpleSearchEngine = new function () {
    this.products = [];
    var self = this;

    this.initialize = function (products) {
        self.products = products;
    };

    this.makeIterator = function (searchValue, ignoreCase) {
        var nextIndex = 0;
        return self.createInnerIterator(nextIndex, searchValue, ignoreCase)
    };

    this.createInnerIterator = function (nextIndex, searchValue, ignoreCase) {
        if (ignoreCase == true) {
            searchValue = searchValue.toLowerCase();
        }

        return {
            next: function () {
                while (nextIndex < self.products.length) {
                    var title = self.products[nextIndex].title;
                    if (ignoreCase) title = title.toLowerCase();

                    if (title.indexOf(searchValue) >= 0) {
                        return {value: self.products[nextIndex++], done: false, nextIndex: nextIndex}
                    } else {
                        nextIndex++;
                    }
                }
                return {done: true};
            }
        }
    };

};

var productsController = new ProductsController(configs.PRODUCTS_DIV_CLASS, manyProducts);
var resultsController = new ProductsController(configs.SEARCH_RESULTS_DIV_CLASS);

var searchBox = new SearchBoxController(configs.SEARCH_INPUT_ID, productsController, resultsController, simpleSearchEngine);
