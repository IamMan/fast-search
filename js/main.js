/**
 * Created by iamaman on 01.11.16.
 */

var globalConfigs = {
    SEARCH_DELAY : 100,
    HEIGHT_SCROLL_OFFSET : 300,
    VISIBLE_ADD_BATCH: 30,
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
    this.currentSearchValue = "";

    var productsController = products;
    this.productsController = productsController;
    var resultsController = results;
    this.resultsController = resultsController;

    this.previousIntervalId = 0;

    var self = this;

    productsController.show();
    resultsController.hide();

    self.previousIntervalId = 0;

    this.hideResults = function () {
        resultsController.hide();
        productsController.show();
    };

    this.showResults = function () {
        productsController.hide();
        resultsController.show();
    };

    searchBox.addEventListener("input", function () {
        if (self.previousIntervalId != 0) clearTimeout(self.previousIntervalId);
        self.previousIntervalId = setTimeout(self.makeSearch, globalConfigs.SEARCH_DELAY)
    });

    this.makeSearch = function () {
        self.cleanState();
        if (self.searchBox.value.length > 0) {
            if (self.currentSearchValue.length == 0) self.showResults();
            self.currentSearchValue = self.searchBox.value;
            self.currentSearchIterator = self.searchEngine.makeIterator(self.currentSearchValue);
            window.addEventListener("scroll", self.iterateSearch);
            self.iterateSearch()
        } else {
            self.hideResults()
        }
    };

    this.cleanState = function () {
        self.currentSearchIterator = null;
        self.currentSearchValue = "";
        window.removeEventListener("scroll", self.iterateSearch);
        self.resultsController.element.innerHTML = "";
        self.previousIntervalId = 0;

    };

    this.iterateSearch = function () {
        if (self.resultsController.isVisibleFull()) {
            return;
        }
        var current = self.currentSearchIterator.next();
        var batchLast = globalConfigs.VISIBLE_ADD_BATCH;
        while (!current.done && batchLast > 0) {
            self.resultsController.addProductHighlighted(current.value, self.currentSearchValue);
            batchLast--;
            current = self.currentSearchIterator.next();
        }
    }
}

function ProductsController(selector, initialProducts) {
    var element = document.getElementsByClassName(selector)[0];
    this.element = element;

    var products = [];
    this.products = products;

    var self = this;

    this.addProduct = function (product) {
        products.push(product);
        self.addToDom(product.title, product.description);
    };

    this.addProductHighlighted = function (product, text) {
        products.push(product);
        var productTitle = product.title.replace(text, "<span style=\"background-color: yellow;\">" + text + "</span>");
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

    this.makeIterator = function (searchValue) {
        var nextIndex = 0;
        return self.createInnerIterator(nextIndex, searchValue)
    };

    this.createInnerIterator = function (nextIndex, searchValue) {
        return {
            next: function () {
                while (nextIndex < self.products.length) {
                    if (self.products[nextIndex].title.indexOf(searchValue) >= 0) {
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
