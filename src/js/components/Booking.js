import {templates, select, settings, classNames} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DataPicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking{
  constructor(element){
    const thisBooking = this;

    thisBooking.selectedTable = null;
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData(){
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.dataPicker.minDate);
    const endDateparam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.dataPicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateparam,
      ],
      eventsCurrent:[
        settings.db.notRepeatParam,
        startDateParam, 
        endDateparam,
      ],
      eventsRepeat:[
        settings.db.repeatParam,
        endDateparam,
      ],

    };

    const urls = {
      booking:       settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])  
      .then(function(allResponse){
        const bookingsResponse = allResponse[0];
        const eventsCurrentResponse = allResponse[1];
        const eventsRepeatResponse = allResponse[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){

        console.log(bookings);
        console.log(eventsCurrent);
        console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.dataPicker.minDate;
    const maxDate = thisBooking.dataPicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    console.log('thisBooking.booked: ', thisBooking.booked);

    thisBooking.updateDom();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }
    const startHour = utils.hourToNumber(hour);

    if(typeof thisBooking.booked[date][startHour] == 'undefined'){
      thisBooking.booked[date][startHour] = [];
    }

    thisBooking.booked[date][startHour].push(table);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock+= 0.5){
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
  
      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDom(){
    const thisBooking = this;

    thisBooking.date = thisBooking.dataPicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }

  }
  initTables(){
    const thisBooking = this;

    for(let table of thisBooking.dom.tables){
      if(table.classList.contains(classNames.booking.tableSelected)){
        table.classList.remove(classNames.booking.tableSelected);
      }
    }

    thisBooking.selectedTable = null;
  }

  selectTable(element){
    const thisBooking = this;
    const tableId = element.getAttribute('data-table');



    if(element.classList.contains(classNames.booking.tableBooked)){
      alert('This table is already booked at this date.');
    } else if(
      element.classList.contains('table') 
      && 
      !element.classList.contains(classNames.booking.tableSelected))
    {
      thisBooking.initTables();
      element.classList.toggle(classNames.booking.tableSelected);
      thisBooking.selectedTable = tableId;
      console.log('clickedElement', thisBooking.selectedTable);
    } 
    else if(
      element.classList.contains('table') 
      && 
      element.classList.contains(classNames.booking.tableSelected))
    {
      element.classList.remove(classNames.booking.tableSelected);
    }

  }

  render(element){
    const thisBooking = this;
    const generateHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generateHTML;
    thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);
    thisBooking.dom.dataPicker = document.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = document.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.floor = document.querySelector(select.booking.floor);
    thisBooking.dom.tables = document.querySelectorAll(select.booking.tables);
  }

  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.dom.peopleAmount.addEventListener('update', function(){});

    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.dom.hoursAmount.addEventListener('update', function(){});

    thisBooking.dataPicker = new DataPicker(thisBooking.dom.dataPicker);
    
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    thisBooking.dom.hourPicker.addEventListener('click', function(){});

    thisBooking.dom.wrapper.addEventListener('update', function(){
      thisBooking.updateDom();
    });
    thisBooking.dom.floor.addEventListener('click', function(event){
      const clickedElement = event.target;
      thisBooking.selectTable(clickedElement);
    });
  }
}
export default Booking;