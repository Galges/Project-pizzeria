import {templates, select, settings, classNames} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
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

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateparam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

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

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

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

    thisBooking.date = thisBooking.datePicker.value;
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

  sendBooking(){
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;

    const reservation = {

      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: parseInt(thisBooking.selectedTable),
      duration: thisBooking.hoursAmount.value,
      ppl: thisBooking.peopleAmount.value,
      starters: [],
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };

    for(let starter of thisBooking.starters) {
      reservation.starters.push(starter);
    }
    console.log('reservation: ', reservation);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservation),
    };

    fetch(url, options)
      .then(thisBooking.makeBooked(reservation.date, reservation.hour, reservation.duration, parseInt(reservation.table)))
      .then(console.log(thisBooking.booked));
  }

  render(element){
    const thisBooking = this;
    const generateHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.starters = [];
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generateHTML;
    thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = document.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = document.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.floor = document.querySelector(select.booking.floor);
    thisBooking.dom.tables = document.querySelectorAll(select.booking.tables);
    thisBooking.dom.bookButton = document.querySelector(select.booking.bookButton);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.starters = document.querySelector(select.booking.starters);
  }

  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.dom.peopleAmount.addEventListener('update', function(){});

    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.dom.hoursAmount.addEventListener('update', function(){});

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    thisBooking.dom.hourPicker.addEventListener('click', function(){});

    thisBooking.dom.wrapper.addEventListener('update', function(){
      thisBooking.updateDom();
    });
    thisBooking.dom.floor.addEventListener('click', function(event){
      const clickedElement = event.target;
      thisBooking.selectTable(clickedElement);
    });
    thisBooking.dom.bookButton.addEventListener('click', function(event){
      const clickedElement = event.target;
      console.log(clickedElement);
      event.preventDefault();
      thisBooking.sendBooking();
    });
  
  
    thisBooking.dom.starters.addEventListener('click', function(event){
      const clickedElement = event.target;
  
      thisBooking.checked = clickedElement.tagName == 'INPUT' && clickedElement.type == 'checkbox' && clickedElement.name == 'starter';
      const indexOfStarter = thisBooking.starters.indexOf(clickedElement.value);
      if(thisBooking.checked && !thisBooking.starters.includes(clickedElement.value)){
        thisBooking.starters.push(clickedElement.value);
        console.log('starters', thisBooking.starters);
      } else if(!thisBooking.checked && thisBooking.starters.includes(clickedElement.value)) {
        thisBooking.starters.splice(indexOfStarter, 1);
        console.log('starters', thisBooking.starters);
      }
    });
  
    thisBooking.dom.wrapper.addEventListener('update', function(){
      thisBooking.updateDom();
      thisBooking.initTables();
    });
  }
}
export default Booking;