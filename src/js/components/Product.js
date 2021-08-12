import {select, classNames, templates} from '../settings.js';
import AmountWidget from './AmountWidget.js';
import utils from '../utils.js';

class Product{
  constructor(id, data){
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;

    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderFrom();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
      
  }

  renderInMenu(){
    const thisProduct = this;
    const generateHTML = templates.menuProduct(thisProduct.data);
    
    thisProduct.element = utils.createDOMFromHTML(generateHTML);
   
    const menuContainer = document.querySelector(select.containerOf.menu);
    menuContainer.appendChild(thisProduct.element);
    
  }

  getElements(){
    const thisProduct = this;
    
    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.imageVisible = thisProduct.element.querySelector(classNames.menuProduct.imageVisible);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAccordion(){
    const thisProduct = this;
   
    thisProduct.accordionTrigger.addEventListener('click', function(event) {
  
      event.preventDefault();
      
      const activeProduct = document.querySelector(select.all.menuProductsActive);
        
      if(activeProduct != null && activeProduct != thisProduct.element){
        activeProduct.classList.remove('active');
      } 
      thisProduct.element.classList.toggle('active');
        
    });
  }

  initOrderFrom(){
    const thisProduct = this;

    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      
    });
      
    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }
      
    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  processOrder(){
    const thisProduct = this;
    const formData = utils.serializeFormToObject(thisProduct.form);

    let price = thisProduct.data.price;
   
    thisProduct.priceSingle = price;
      
    for(let paramId in thisProduct.data.params) {
      
      const param = thisProduct.data.params[paramId];

      for(let optionId in param.options) {
        
        const option = param.options[optionId];
        const optionPrice = option.price;
                    
        const checkedBoxCondition = formData[paramId] && formData[paramId].includes(optionId);
        const optionImage = thisProduct.imageWrapper.querySelector('.'+ paramId + '-' + optionId);

        if(checkedBoxCondition){                                        
          if(option.default){
            console.log('Price do not change unless was not checked');
              
          } else if(!option.default){
            price = price + optionPrice;
            console.log('Price added: ', price);
               
          }
            
        } else if(option.default){
          price = price - optionPrice;
          console.log('Price subtracted: ', price);
        }
          
        if(optionImage){
          optionImage.classList.add(classNames.menuProduct.imageVisible);
          if(checkedBoxCondition){
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          } else {
            optionImage.classList.remove(classNames.menuProduct.imageVisible); 
          }
              
        }
      }
    }
      
    price *= thisProduct.amountWidget.value;
    thisProduct.priceSingle = price;
    thisProduct.priceElem.innerHTML = price;
  }

  initAmountWidget(){
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    // eslint-disable-next-line no-unused-vars
    thisProduct.amountWidgetElem.addEventListener('update', function(event){
      thisProduct.processOrder();
    });
  }

  addToCart(){
    const thisProduct = this;

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct
      }
    });
    thisProduct.element.dispatchEvent(event);  
  }

  prepareCartProduct(){
    const thisProduct = this;

    const productSummary = {};
    productSummary.id = thisProduct.id;
    productSummary.name = thisProduct.data.name;
    productSummary.params = thisProduct.prepareCartProductParams();
    productSummary.amount = thisProduct.amountWidget.value; 
    productSummary.priceSingle = thisProduct.priceSingle;
    productSummary.price = productSummary.amount * productSummary.priceSingle;
      
      
    console.log('productSummary: ', productSummary);
    console.log('cart params: ',thisProduct.prepareCartProductParams());
    return productSummary;
  }

  prepareCartProductParams(){
    const thisProduct = this;
    
    const formData = utils.serializeFormToObject(thisProduct.form);

    const params = {};
      
    for(let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];
      params[paramId] = {
        label: param.label,
        options: {}
      };

      for(let optionId in param.options) {
        
        const option = param.options[optionId];          

        const checkedBoxCondition = formData[paramId] && formData[paramId].includes(optionId);        

        if(checkedBoxCondition){                                        
          params[paramId].options[optionId] = option.label;
                          
        }
      }        
    }
    return params;
  }
}

export default Product;