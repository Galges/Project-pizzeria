import {templates, select} from '../settings.js';
import Carousel from './Carousel.js';


class Home{
  constructor(element){
    const thisHome = this;

    thisHome.selectedTable = null;
    thisHome.render(element);
    thisHome.initCarousel();
  }

  render(element){
    const thisHome = this;

    const generateHTML = templates.homePage();
    thisHome.dom = {};
    thisHome.dom.wrapper = element;
    thisHome.dom.wrapper.innerHTML = generateHTML;
    thisHome.dom.carouselWidget = document.querySelector(select.widgets.carousel.wrapper);
  }

  initCarousel(){
    const thisHome = this;

    thisHome.carouselWidget = new Carousel(thisHome.dom.carouselWidget);
  }
}

export default Home;