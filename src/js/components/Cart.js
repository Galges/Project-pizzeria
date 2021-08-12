import {settings, select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart{
  constructor(element){
    const thisCart = this;

    thisCart.products = [];

    thisCart.getElements(element);
    thisCart.initActions();
      
  }

  getElements(element){
    const thisCart = this;

    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    thisCart.dom.totalPriceSum = thisCart.dom.wrapper.querySelector(select.cart.totalPriceSum);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
    
  }

  initActions(){
    const thisCart = this;

    // eslint-disable-next-line no-unused-vars
    thisCart.dom.toggleTrigger.addEventListener('click', function(event){
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });
      
    thisCart.dom.productList.addEventListener('update', function(){
      thisCart.update();
    });
    thisCart.dom.productList.addEventListener('remove', function(event){
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisCart.sendOrder();
    });
  }

  sendOrder(){
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.order;
    const payload = {

      address: thisCart.dom.address.value,
      phone: thisCart.dom.phone.value,
      ptotalPrice: thisCart.totalPrice,
      subtotalPrice: thisCart.subtotalPrice,
      totalNumber: thisCart.totalNumber,
      deliveryFee: thisCart.deliveryFee,
      products: [],
    };

    for(let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }
    console.log('payload: ', payload);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
      
    fetch(url, options);
  }

  add(menuProduct){
    const thisCart = this;
    const generateHTML = templates.cartProduct(menuProduct);
    const generatedHTML = utils.createDOMFromHTML(generateHTML);
    
    thisCart.dom.productList.appendChild(generatedHTML);
    thisCart.products.push( new CartProduct(menuProduct, generatedHTML));   
    console.log('thisCart.products: ', thisCart.products);   

    thisCart.update();
  }

  update(){
    const thisCart = this;

    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;
      
    for(let product of thisCart.products){
      thisCart.totalNumber = thisCart.totalNumber + product.amount;
      thisCart.subtotalPrice = thisCart.subtotalPrice + product.price;
    }      
      
    if(thisCart.totalNumber !== 0){        
      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
    } else{
      thisCart.deliveryFee = 0;
      thisCart.totalPrice = 0;
    }

    thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      
    for(let price of thisCart.dom.totalPrice){
      price.innerHTML = thisCart.totalPrice; 
    }
  }

  remove(cartProduct){
    const thisCart = this;
    const indexOfProduct = thisCart.products.indexOf(cartProduct);
    thisCart.products.splice(indexOfProduct, 1);
    cartProduct.dom.wrapper.remove();
    thisCart.update();
  }
}
export default Cart;