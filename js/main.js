/**
 * Created by iamaman on 01.11.16.
 */

var globalConfigs = {
    SEARCH_DELAY : 300
};

var configs = new function() {
    this.SEARCH_INPUT_ID = "search";
    this.SEARCH_CONTAINER_ID = "container";
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
        if (self.previousIntervalId != 0) clearInterval(self.previousIntervalId);
        self.previousIntervalId = setInterval(self.makeSearch, globalConfigs.SEARCH_DELAY)
    });

    this.canSearchBoxContinue = function (oldValue, newValue) {
      return newValue.startsWith(oldValue) && oldValue.length > 0;
    };

    this.canContinueCurrentSearch = function() {
        var newSearchValue = searchBox.value;
        return self.canSearchBoxContinue(self.currentSearchValue, newSearchValue)
            && self.searchEngine.canContinueCurrentSearch(self.currentSearchValue, newSearchValue)
    };

    this.makeSearch = function () {
        // if (self.canContinueCurrentSearch()) {
        //     self.currentSearchValue = self.searchBox.value;
        //     self.currentSearchIterator = self.searchEngine.continueIterator(self.currentSearchValue, self.currentSearchIterator);
        // } else {
            self.cleanState();
            if (self.searchBox.value.length > 0) {
                if (self.currentSearchValue.length == 0) self.showResults();

                self.currentSearchValue = self.searchBox.value;
                self.currentSearchIterator = self.searchEngine.makeIterator(self.currentSearchValue);
                self.resultsController.element.addEventListener("scroll", self.iterateSearch);
                self.iterateSearch()
            } else {
                self.hideResults()
            }

        // }
    };

    this.cleanState = function () {
        self.currentSearchIterator = null;
        self.currentSearchValue = "";
        self.resultsController.element.removeEventListener("scroll", self.iterateSearch);
        self.resultsController.element.innerHTML = "";
        self.previousIntervalId = 0;
    };

    this.iterateSearch = function () {
        var current = self.currentSearchIterator.next();
        while(!current.done) {
            self.resultsController.addProduct(current.value);
            if (self.resultsController.isVisibleFull()) {
                break;
            }
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
        self.addToDom(product)
    };

    this.addToDom = function (product) {
        var elem = "<div class='product'>" +
            "<div class='title'>" + product.title + "</div>" +
            "<div class='description'>" + product.description + "</div>" +
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
        return false
    };

    if (initialProducts != null) {
        initialProducts.forEach(this.addProduct);
    }
}

var simpleSearchEngine;
simpleSearchEngine = new function () {
    var products = [];
    this.products = products;
    var self = this;

    this.initialize = function (products) {
        self.products = products;
    };

    this.canContinueCurrentSearch = function (oldValue, newValue) {
        return newValue.startsWith(oldValue);
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

    this.continueIterator = function (newValue, oldIterator) {
        var nextIndex = oldIterator.nextIndex;
        return self.createInnerIterator(nextIndex, newValue)
    }

};

var productsController = new ProductsController(configs.PRODUCTS_DIV_CLASS, manyProducts);
var resultsController = new ProductsController(configs.SEARCH_RESULTS_DIV_CLASS);

var searchBox = new SearchBoxController(configs.SEARCH_INPUT_ID, productsController, resultsController, simpleSearchEngine);
