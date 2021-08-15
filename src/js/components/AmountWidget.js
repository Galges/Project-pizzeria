import {settings, select} from '../settings.js';
import BaseWidget from './BaseWidget.js';

class AmountWidget extends BaseWidget{
  constructor(element){
    super(element, settings.amountWidget.defaultValue);
    // eslint-disable-next-line no-unused-vars
    const thisWidget = this;

    thisWidget.getElements(element);
    thisWidget.initActions();
  }

  getElements(){
    const thisWidget = this;
    
    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input);
    thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
    thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);
  }

  isValid(value){
    return value<=settings.amountWidget.defaultMax 
    && value>=settings.amountWidget.defaultMin
    && !isNaN(value);
  }

  renderValue(){
    const thisWidget = this;

    thisWidget.dom.input.value = thisWidget.value;
  }

  initActions(){
    const thisWidget = this;

    thisWidget.dom.input.addEventListener('change', function(){
      thisWidget.setValue(thisWidget.dom.input.value);
    });
    thisWidget.dom.linkDecrease.addEventListener('click', function(event){
      event.preventDefault();
      thisWidget.setValue(thisWidget.value-1);
    });
    thisWidget.dom.linkIncrease.addEventListener('click', function(event){
      event.preventDefault();
      thisWidget.setValue(thisWidget.value+1);
    });
  }

  announce(){
    const thisWidget = this;

    const event = new CustomEvent('update', {
      bubbles: true
    });
    thisWidget.dom.wrapper.dispatchEvent(event);
  }
    
}

export default AmountWidget;