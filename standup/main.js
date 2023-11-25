import { Notification } from "./scripts/notification.js";
import "./style.css";
import TomSelect from "tom-select";
import Inputmask from "inputmask";
import JustValidate from "just-validate";

const MAX_COMEDIANS = 6;

const notification = Notification.getInstance();

const bookingComediansList = document.querySelector(".booking__comedians-list");

const bookingForm = document.querySelector(".booking__form");

//день 4 видео 1 время 1:12:00 показывается вся функция
const createComedianBlock = (comedians) => {
  const bookingComedian = document.createElement("li");
  bookingComedian.classList.add("booking__comedian");

  const bookingSelectComedian = document.createElement("select");
  bookingSelectComedian.classList.add(
    "booking__select",
    "booking__select_comedian"
  );

  const bookingSelectTime = document.createElement("select");
  bookingSelectTime.classList.add("booking__select", "booking__select_time");

  const inputHidden = document.createElement("input");
  inputHidden.type = "hidden";
  inputHidden.name = "booking";

  const bookingHall = document.createElement("button");
  bookingHall.classList.add("booking__hall");
  bookingHall.type = "button";

  bookingComedian.append(bookingSelectComedian, bookingSelectTime, inputHidden);
  //день 4 видео 1 время 49:20

  const bookingTomSelectComedian = new TomSelect(bookingSelectComedian, {
    hideSelected: true,
    placeholder: "Выбрать комика",
    options: comedians.map((item) => ({
      value: item.id,
      text: item.comedian,
    })),
  });

  const bookingTomSelectTime = new TomSelect(bookingSelectTime, {
    hideSelected: true,
    placeholder: "Время",
  });
  bookingTomSelectTime.disable();

  bookingTomSelectComedian.on("change", (id) => {
    bookingTomSelectTime.enable();
    bookingTomSelectComedian.blur();
    const { performances } = comedians.find((item) => item.id === id);
    bookingTomSelectTime.clear();
    bookingTomSelectTime.clearOptions();
    bookingTomSelectTime.addOptions(
      performances.map((item) => ({
        value: item.time,
        text: item.time,
      }))
    );

    bookingHall.remove();
  });

  bookingTomSelectTime.on("change", (time) => {
    if (!time) {
      return;
    }
    const idComedian = bookingTomSelectComedian.getValue();
    const { performances } = comedians.find((item) => item.id === idComedian);
    const { hall } = performances.find((item) => item.time === time);
    inputHidden.value = `${idComedian},${time}`;

    bookingTomSelectTime.blur();
    bookingHall.textContent = hall;
    bookingComedian.append(bookingHall);
  });

  const createNextBookingComedian = () => {
    if (bookingComediansList.children.length < MAX_COMEDIANS) {
      const nextComediansBlock = createComedianBlock(comedians);
      bookingComediansList.append(nextComediansBlock);
    }

    bookingTomSelectTime.off("change", createNextBookingComedian);
  };

  bookingTomSelectTime.on("change", createNextBookingComedian);

  return bookingComedian;
};

const getComedian = async () => {
  const response = await fetch("http://localhost:8080/comedians");
  return response.json();
};

const init = async () => {
  const countComedians = document.querySelector(
    ".event__info-item_comedians .event__info-number"
  );

  const comedians = await getComedian();

  countComedians.textContent = comedians.length;

  const comedianBlock = createComedianBlock(comedians);

  bookingComediansList.append(comedianBlock);

  //валидация день 5 видео 1 время 42:33
  const validate = new JustValidate(bookingForm, {
    errorFieldCssClass: "booking__input_invalid",
    successFieldCssClass: "booking__input_valid",
  });

  const bookingInputFullname = document.querySelector(
    ".booking__input_fullname"
  );
  const bookingInputPhone = document.querySelector(".booking__input_phone");
  const bookingInputTicket = document.querySelector(".booking__input_ticket");

  new Inputmask("+7(999)-999-9999").mask(bookingInputPhone);
  new Inputmask("99999999").mask(bookingInputTicket);

  validate
    .addField(bookingInputFullname, [
      {
        rule: "required",
        errorMessage: "Заполните имя",
      },
    ])
    .addField(bookingInputPhone, [
      {
        rule: "required",
        errorMessage: "Заполните телефон",
      },
      {
        validator() {
          const phone = bookingInputPhone.inputmask.unmaskedvalue();
          return phone.length === 10 && !!Number(phone);
        },
        errorMessage: "Некорректный телефон",
      },
    ])
    .addField(bookingInputTicket, [
      {
        rule: "required",
        errorMessage: "Заполните номер билета",
      },
      {
        validator() {
          const ticket = bookingInputTicket.inputmask.unmaskedvalue();
          return ticket.length === 8 && !!Number(ticket);
        },
        errorMessage: "Неверный номер билета",
      },
    ]);
  // .onFail((field) => {
  //   let errorMessage = "";
  //   for (const key in fields) {
  //     if (!Object.hasOwnProperty.call(fields, key)) {
  //       continue;
  //     }

  //     const element = fields[key];
  //     if (!element.isValid) {
  //       errorMessage += `${element.errorMessage}, `;
  //     }
  //   }

  //   notification.show(errorMessage.slice(0, -2), false);
  // });

  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = { booking: [] };
    const times = new Set();

    //день 5 видео 1 время 11:18
    new FormData(bookingForm).forEach((value, field) => {
      if (field === "booking") {
        const [comedian, time] = value.split(",");

        if (comedian && time) {
          data.booking.push({ comedian, time });
          times.add(time);
        }
      } else {
        data[field] = value;
      }

      if (times.size !== data.booking.length) {
        notification.show(
          "Нельзя быть в одно время на двух выступлениях",
          false
        );
      }
    });
  });
};

init();
