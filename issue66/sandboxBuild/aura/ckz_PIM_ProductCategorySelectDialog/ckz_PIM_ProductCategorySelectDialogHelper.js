({
  displaySelectedCategoryTree: function (component) {

    component.set("v.storefrontCategoryTree", []);

    var storefront = component.find("selectStorefront").get("v.value");

    //var storefront = component.get("v.selectedStorefront");

    console.log("displaySelectedCategoryTree: " + storefront);

    try {
      component.set("v.selectedStorefront", storefront);

      var allCategoryItems = component.get("v.allCategoryItems");

      if (allCategoryItems.length > 0) {
        for (var i = 0; i < allCategoryItems.length; i++) {
          var tempCategoryTree = allCategoryItems[i];
          if (tempCategoryTree.label == storefront) {
            component.set("v.storefrontCategoryTree", tempCategoryTree.items);
          }
        }
      }

    }
    catch (err) {
      console.log('error message: ' + err.message);
    }
  },
  getSelectedCategoryName: function (component, categoryId) {
    var storefrontCategoryTree = component.get("v.storefrontCategoryTree");
    var categoryName = null;
    for(var i = 0; i < storefrontCategoryTree.length; i++) {
      var category = storefrontCategoryTree[i];
      categoryName = this.lookForCategory(categoryId, category);
      if(categoryName && categoryName != null) {
        break;
      }
    }

    console.log('categoryName found: ' + categoryName);
    return categoryName;
  },
  lookForCategory: function(categoryId, category) {

    if(category.name === categoryId) {
      return category.label;
    }
    else {
      var items = category.items;
      if(items && items.length > 0) {
        for(var i = 0; i < items.length; i++) {
          var childCategory = items[i];
          var categoryName = this.lookForCategory(categoryId, childCategory);
          if(categoryName) {
            return categoryName;
          }
        }
      }
    }
  },

})