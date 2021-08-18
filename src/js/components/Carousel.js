class Carousel{
  constructor(element){
    const thisWidget = this;
  
    thisWidget.render(element);
    thisWidget.initWidget();
  }
  
  render(element){
    const thisWidget = this;
    thisWidget.wrapper = element;
  }
  
  initWidget(){
    const thisWidget = this;
    // eslint-disable-next-line no-undef
    new Flickity( thisWidget.wrapper,{
      cellAlign: 'left',
      contain: true,
      autoPlay: 3000,
      prevNextButtons: false,
      wrapAround: true,
    });
  }
}
  
export default Carousel;