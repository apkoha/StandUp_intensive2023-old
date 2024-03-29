import Inputmask from "inputmask";
import JustValidate from "just-validate";
import { Notification } from "./notification.js";
import { sendData } from "./api.js";

export const initForm = (
  bookingForm,
  bookingInputFullname,
  bookingInputPhone,
  bookingInputTicket,
  changeSection,
  bookingComediansList
) => {
  //валидация день 5 видео 1 время 42:33
  const validate = new JustValidate(bookingForm, {
    errorFieldCssClass: "booking__input_invalid",
    successFieldCssClass: "booking__input_valid",
  });

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
    ])
    .onFail((fields) => {
      let errorMessage = "";
      for (const key in fields) {
        if (!Object.hasOwnProperty.call(fields, key)) {
          continue;
        }

        const element = fields[key];
        if (!element.isValid) {
          errorMessage += `${element.errorMessage}, `;
        }
      }

      Notification.getInstance().show(errorMessage.slice(0, -2), false);
    });

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validate.isValid) {
      return;
    }

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
    });

    if (times.size !== data.booking.length) {
      Notification.getInstance().show(
        "Нельзя быть в одно время на двух выступлениях",
        false
      );
    }

    console.log(data);
    if (!times.size) {
      Notification.getInstance().show("Вы не выбрали комика и/или время");
    }

    const method = bookingForm.getAttribute("method");
    console.log("bookingForm: ", bookingForm);

    let isSend = false;

    if (method === "PATCH") {
      isSend = await sendData(method, data, data.ticketNumber);
    } else {
      isSend = await sendData(method, data);
    }

    if (isSend) {
      Notification.getInstance().show("Бронь принята", true);
      changeSection(); //Бонус видео 2 время 28:46
      bookingForm.reset();
      bookingComediansList.textContent = "";
    }
  });
};

//отправка данных на сервер Бонус видео 2 время 25:11
