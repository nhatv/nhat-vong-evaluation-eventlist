const eventAPIs = (function () {
  const API_URL = "http://localhost:3000/events";

  async function getEvents() {
    return fetch(API_URL).then((res) => res.json());
  }

  async function addEvent(newEvent) {
    return fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newEvent),
    }).then((res) => res.json());
  }

  async function deleteEvent(id) {
    return fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    }).then((res) => res.json());
  }

  async function editEvent(id, newEvent) {
    return fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newEvent),
    }).then((res) => res.json());
  }

  return {
    getEvents,
    addEvent,
    deleteEvent,
    editEvent,
  };
})();

class EventView {
  constructor() {
    this.newEventForm = document.querySelector(".new-event-form");
    this.eventNameInput = document.querySelector("#eventName");
    this.eventStartDate = document.querySelector("#startDate");
    this.eventEndDate = document.querySelector("#endDate");
    this.eventList = document.querySelector(".event-list");
    this.newEventButton = document.querySelector(".new-event-btn");
    this.deleteExpiredEventsButton =
      document.querySelector(".remove-events-btn");
  }

  renderEvents(events) {
    this.eventList.innerHTML = "";

    events.forEach((e) => {
      this.renderNewEvent(e);
    });
  }

  removeEventElem(id) {
    const eventToRemove = document.getElementById(id);
    eventToRemove.remove();
  }

  renderNewEvent(newEvent) {
    this.eventList.appendChild(this.createEventElement(newEvent));
  }

  removeExpiredEvents(events) {
    const currDate = new Date();
    return events.map((e) => {
      if (this.checkExpiredDate(currDate, e.endDate)) {
        return e.id;
      }
      return;
    });
  }

  checkExpiredDate(currDate, eventDate) {
    const current = new Date(currDate);
    const end = new Date(eventDate);

    return current > end; // return true if expired
  }

  createEventElement(ev) {
    const eventElement = document.createElement("div");
    eventElement.classList.add("event-item");
    eventElement.setAttribute("id", ev.id);
    eventElement.innerHTML = `
            <div class="event-item__text">${ev.eventName}</div>
            <div class="event-item__start">${ev.startDate}</div>
            <div class="event-item__end">${ev.endDate}</div>
            <button class="event-item__edit-btn">Edit</button>
            <button class="event-item__delete-btn">Delete</button>
    `;
    return eventElement;
  }

  assignNewForm() {
    this.newEventForm = document.querySelector(".new-event-form");
    this.eventNameInput = document.querySelector("#eventName");
    this.eventStartDate = document.querySelector("#startDate");
    this.eventEndDate = document.querySelector("#endDate");
    this.eventList = document.querySelector(".event-list");
  }

  createEventForm(name = "", start = "", end = "") {
    const eventForm = document.createElement("div");
    eventForm.classList.add("event-item");
    eventForm.innerHTML = `
            <form class="new-event-form">
              <input type="text" name="eventName" id="eventName" placeholder="${name}" />
              <input type="date" name="startDate" id="startDate" placeholder="${start}" />
              <input type="date" name="endDate" id="endDate" placeholder="${end}" />
              <button class="event-form__save-btn">Save</button>
              <button class="event-form__delete-btn">Delete</button>
            </form>
    `;

    this.eventList.appendChild(eventForm);
    return eventForm.firstElementChild;
  }
}

class EventModel {
  #events;
  constructor(events = []) {
    this.#events = events;
  }

  getEvents() {
    return this.#events;
  }

  getEventFromId(id) {
    this.#events = this.#events.filter((e) => e.id === id);
  }

  setEvents(newEvents) {
    this.#events = newEvents;
  }

  addEvent(newEvent) {
    this.#events.push(newEvent);
  }

  deleteEvent(id) {
    this.#events = this.#events.filter((e) => e.id !== id);
  }

  editEvent(id, newEvent) {}
}

class EventController {
  constructor(view, model) {
    this.view = view;
    this.model = model;
    this.init();
  }

  init() {
    this.setUpEvents();
    this.fetchEvents();
  }

  setUpEvents() {
    this.setUpNewEventForm();
    this.setUpDeleteEvent();
    this.setUpEditEvent();
    this.setUpDeleteExpiredEvents();
    // this.setUpSubmitEvents();
  }

  async fetchEvents() {
    const events = await eventAPIs.getEvents();
    this.view.renderEvents(events);
  }

  setUpEditEvent() {
    this.view.eventList.addEventListener("click", async (e) => {
      const elem = e.target;
      if (elem.classList.contains("event-item__edit-btn")) {
        const eventItemElem = elem.parentElement;
        const editId = eventItemElem.id;
        console.log(eventItemElem.classList, editId);

        // hide the original element then add new form?
        this.view.newEventForm = this.view.createEventForm();
        this.setUpSubmitEdit();
      }
    });
  }

  setUpDeleteEvent() {
    // deal with new form delete button separately since it won't have id
    // event delegation
    this.view.eventList.addEventListener("click", async (e) => {
      const elem = e.target;
      console.log(elem);

      if (elem.classList.contains("event-item__delete-btn")) {
        const eventItemElem = elem.parentElement;
        const deleteId = eventItemElem.id;
        await eventAPIs.deleteEvent(deleteId);
        this.model.deleteEvent(deleteId);
        this.view.removeEventElem(deleteId);

        // console.log(deleteId);
      } else if (elem.classList.contains("event-form__delete-btn")) {
        const eventItemElem = elem.parentElement.parentElement;
        eventItemElem.remove();
      }
    });
  }

  setUpNewEventForm() {
    this.view.newEventButton.addEventListener("click", (e) => {
      e.preventDefault();
      this.view.newEventForm = this.view.createEventForm();
      console.log(this.view.newEventForm);
      this.setUpSubmitEvents();
    });
  }

  setUpSubmitEdit() {
    this.view.assignNewForm();
    this.view.newEventForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const elem = e.target;
      const eventItemElem = elem.parentElement;
      const editId = eventItemElem.id;
      // console.log(e.target);
      // console.log(this.view.eventEndDate.value);
      const input = this.view.eventNameInput;
      const eventName = input.value;
      const startDate = this.view.eventStartDate.value;
      const endDate = this.view.eventEndDate.value;
      if (!eventName || !startDate || !endDate) {
        return; // don't accept any empty inputs
      }
      const newEvent = await eventAPIs.editEvent(editId, {
        eventName,
        startDate,
        endDate,
      });
      // console.log(newEvent);
      this.model.addEvent(newEvent);
      this.view.newEventForm.parentElement.remove();
      this.view.renderNewEvent(newEvent);
    });
  }

  setUpSubmitEvents() {
    this.view.assignNewForm();
    this.view.newEventForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      // console.log(e.target);
      // console.log(this.view.eventEndDate.value);
      const input = this.view.eventNameInput;
      const eventName = input.value;
      const startDate = this.view.eventStartDate.value;
      const endDate = this.view.eventEndDate.value;
      if (!eventName || !startDate || !endDate) {
        return; // don't accept any empty inputs
      }
      const newEvent = await eventAPIs.addEvent({
        eventName,
        startDate,
        endDate,
      });
      // console.log(newEvent);
      this.model.addEvent(newEvent);
      this.view.newEventForm.parentElement.remove();
      this.view.renderNewEvent(newEvent);
    });
  }

  setUpDeleteExpiredEvents() {
    this.view.deleteExpiredEventsButton.addEventListener("click", async (e) => {
      // console.log(this.view.eventList);
      // console.log(this.view.checkExpiredDate("2025-07-15", "2025-07-1"));
      const events = await eventAPIs.getEvents();
      // console.log(this.view.removeExpiredEvents(events));
      for (const deleteId of this.view.removeExpiredEvents(events)) {
        if (deleteId) {
          await eventAPIs.deleteEvent(deleteId);
          this.model.deleteEvent(deleteId);
          this.view.removeEventElem(deleteId);
        }
        // console.log(deleteId);
      }
      // get ids from expired events
      // remove them from database
    });
  }
}

const eventView = new EventView();
const eventModel = new EventModel();
const eventController = new EventController(eventView, eventModel);
