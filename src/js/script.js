/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  ('use strict');

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice:
        '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(
      document.querySelector(select.templateOf.menuProduct).innerHTML
    ),
    cartProduct: Handlebars.compile(
      document.querySelector(select.templateOf.cartProduct).innerHTML
    ),
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }

    renderInMenu() {
      const thisProduct = this;

      const generateHTML = templates.menuProduct(thisProduct.data);
      thisProduct.element = utils.createDOMFromHTML(generateHTML);
      const menuContainer = document.querySelector(select.containerOf.menu);
      menuContainer.appendChild(thisProduct.element);
    }

    getElements() {
      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.element.querySelector(
        select.menuProduct.clickable
      );
      thisProduct.form = thisProduct.element.querySelector(
        select.menuProduct.form
      );
      thisProduct.formInputs = thisProduct.form.querySelectorAll(
        select.all.formInputs
      );
      thisProduct.cartButton = thisProduct.element.querySelector(
        select.menuProduct.cartButton
      );
      thisProduct.priceElem = thisProduct.element.querySelector(
        select.menuProduct.priceElem
      );
      thisProduct.imageWrapper = thisProduct.element.querySelector(
        select.menuProduct.imageWrapper
      );
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(
        select.menuProduct.amountWidget
      );
    }

    initAccordion() {
      const thisProduct = this,
        click = thisProduct.accordionTrigger;

      click.addEventListener('click', function() {
        event.preventDefault();
        thisProduct.element.classList.add(classNames.menuProduct.wrapperActive);

        const activeProducts = document.querySelectorAll('.product.active');

        for (let activeProduct of activeProducts) {
          if (activeProduct !== thisProduct.element) {
            activeProduct.classList.remove(
              classNames.menuProduct.wrapperActive
            );
          }
        }
      });
    }

    initOrderForm() {
      const thisProduct = this;
      thisProduct.form.addEventListener('submit', function(event) {
        event.preventDefault();
        thisProduct.processOrder();
      });

      for (let input of thisProduct.formInputs) {
        input.addEventListener('change', function() {
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function(event) {
        event.preventDefault();
        thisProduct.processOrder();
      });
    }

    processOrder() {
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      let price = thisProduct.data.price;
      
      for (let paramId in thisProduct.data.params) {
        const param = thisProduct.data.params[paramId];

        for (let optionId in param.options) {
          const option = param.options[optionId],
            imageId = `.${paramId}-${optionId}`,
            activeImages = thisProduct.imageWrapper.querySelectorAll(imageId);

          const optionSelected =
            formData.hasOwnProperty(paramId) &&
            formData[paramId].indexOf(optionId) > -1;

          if (optionSelected && !option.default) {
            price += option.price;
          } else if (!optionSelected && option.default) {
            price -= option.price;
          }
          
          if (optionSelected) {
            for (let activeImage of activeImages) {
              activeImage.classList.add(classNames.menuProduct.imageVisible);
            }
          } else {
            for (let activeImage of activeImages) {
              activeImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }
      }
      price = price * thisProduct.amountWidget.value;
      thisProduct.priceElem.innerHTML = price;
    }

    initAmountWidget() {
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem); //'.widget-amount'
      thisProduct.amountWidgetElem.addEventListener('updated', function() {
        thisProduct.processOrder();
      });
    }
  }

  class AmountWidget {
    constructor(element) {
      const thisWidget = this;

      thisWidget.value = settings.amountWidget.defaultValue;

      thisWidget.getElements(element);
      thisWidget.setValue(thisWidget.value);
      thisWidget.initActions();
      thisWidget.announce();
    }

    getElements(element) {
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(
        select.widgets.amount.input
      );
      thisWidget.linkDecrease = thisWidget.element.querySelector(
        select.widgets.amount.linkDecrease
      );
      thisWidget.linkIncrease = thisWidget.element.querySelector(
        select.widgets.amount.linkIncrease
      );
    }

    setValue(value) {
      const thisWidget = this,
        newValue = parseInt(value);

      if (newValue !== thisWidget.value && newValue >= 1 && newValue <= 9) {
        thisWidget.value = newValue;
        thisWidget.announce();
      }
      thisWidget.input.value = thisWidget.value;
    }

    initActions() {
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function() {
        thisWidget.setValue(thisWidget.input.value);
      });

      thisWidget.linkDecrease.addEventListener('click', function(event) {
        event.preventDefault();
        const valueDecrease = thisWidget.value - 1;
        thisWidget.setValue(valueDecrease);
      });

      thisWidget.linkIncrease.addEventListener('click', function(event) {
        event.preventDefault();
        const valueIncrease = thisWidget.value + 1;
        thisWidget.setValue(valueIncrease);
      });
    }

    announce() {
      const thisWidget = this;
      const event = new Event('updated');
      thisWidget.element.dispatchEvent(event);
    }
  }

  class Cart {
    constructor(element) {
      const thisCart = this;
      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();
      console.log('new Cart', thisCart);
    }

    getElements(element) {
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      console.log('==========',  thisCart.dom.toggleTrigger);
    }

    initActions() {
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function(){
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
    }
  }

  const app = {
    initData: function() {
      const thisApp = this;
      thisApp.data = dataSource;
    },

    initMenu: function() {
      const thisApp = this;
      for (let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
      }
    },

initCart: function() {
      const thisApp = this;
      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },

    init: function() {
      const thisApp = this;
      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },
  };

  app.init();
}