import React, { useState } from "react";
import { useForm } from "react-hook-form";

type InvoiceFormInputs = {
  invoiceNumber: string;
  date: string;
  buyer: string;
  description?: string;
};

type Item = {
  name: string;
  quantity: number;
  price: number;
  description?: string;
};

export default function InvoiceForm() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InvoiceFormInputs>();

  const {
    register: itemRegister,
    handleSubmit: handleItemSubmit,
    formState: { errors: itemErrors },
    reset: resetItemForm,
  } = useForm<Item>();

  const openModal = () => {
    setIsModalOpen(true);
    resetItemForm(); // Reset فرم مدال قبل از باز شدن
    setEditingItemIndex(null); // بازنشانی استیت ویرایش
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetItemForm(); // فقط فرم مدال پاک می‌شود
    setEditingItemIndex(null); // بازنشانی استیت ویرایش
  };

  const addItem = (data: Item) => {
    if (editingItemIndex === null) {
      setItems([...items, data]);
    } else {
      const updatedItems = [...items];
      updatedItems[editingItemIndex] = data; // جایگزینی آیتم ویرایش شده
      setItems(updatedItems);
    }
    closeModal();
  };

  const onSubmit = async (data: InvoiceFormInputs) => {
    if (items.length === 0) {
      setErrorMessage("لطفاً افزودن کالا را تکمیل کنید.");
      return;
    } else {
      setErrorMessage(null);
    }

    const invoicePayload = {
      ...data,
      items: items,
    };

    try {
      const response = await fetch("http://localhost:5000/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoicePayload),
      });

      if (!response.ok) {
        throw new Error("ارسال فاکتور با شکست مواجه شد");
      }

      const result = await response.json();
      console.log("فاکتور با موفقیت ثبت شد:", result);

      setSuccessMessage("فاکتور با موفقیت ثبت شد!");
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      reset({
        invoiceNumber: "",
        date: "",
        buyer: "",
        description: "",
      });
      setItems([]); // پاک کردن آیتم‌ها پس از ارسال
    } catch (error) {
      console.error("خطا در ارسال فاکتور:", error);
    }
  };

  const handleDeleteItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const handleEditItem = (index: number) => {
    const itemToEdit = items[index];
    setEditingItemIndex(index);
    resetItemForm(itemToEdit); // فرم مدال را با داده‌های آیتم پر می‌کند
    openModal();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="invoice-container">
      <h2 className="invoice-title">فاکتور فروش</h2>
      <h3 className="invoice-title2">ابتدا افزودن کالا را تکمیل نمایید</h3>

      <div className="form-group">
        <label htmlFor="invoiceNumber">شماره فاکتور:</label>
        <input
          id="invoiceNumber"
          {...register("invoiceNumber", {
            required: "شماره فاکتور الزامی است",
            pattern: {
              value: /^[0-9]+$/,
              message: "فقط عدد وارد شود",
            },
          })}
        />
        {errors.invoiceNumber && (
          <p className="error-message">{errors.invoiceNumber.message}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="date">تاریخ:</label>
        <input
          id="date"
          placeholder="مثلاً 1403-02-15"
          {...register("date", {
            required: "تاریخ الزامی است",
            pattern: {
              value: /^\d{4}-\d{2}-\d{2}$/,
              message: "فرمت تاریخ صحیح نیست",
            },
          })}
        />
        {errors.date && <p className="error-message">{errors.date.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="buyer">نام خریدار:</label>
        <input
          id="buyer"
          {...register("buyer", {
            required: "نام خریدار الزامی است",
            pattern: {
              value: /^[\u0600-\u06FFa-zA-Z\s]+$/,
              message: "فقط حروف وارد شود",
            },
          })}
        />
        {errors.buyer && (
          <p className="error-message">{errors.buyer.message}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="description">شرح:</label>
        <input id="description" {...register("description")} />
      </div>

      <button type="button" onClick={openModal} className="add-item-btn">
        + افزودن کالا
      </button>

      {items.length > 0 && (
        <div className="item-list">
          {items.map((item, index) => (
            <div className="item-card" key={index}>
              <strong>{item.name}</strong>
              <span>{item.quantity} عدد - {item.price} تومان</span>
              <div className="item-actions">
                <button
                  type="button"
                  onClick={() => handleEditItem(index)}
                  className="edit-btn"
                >
                  ویرایش
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(index)}
                  className="delete-btn"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="invoice-total">
        <strong>مجموع فاکتور: {items.reduce((sum, item) => sum + item.price * item.quantity, 0)} تومان</strong>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingItemIndex === null ? "افزودن کالا" : "ویرایش کالا"}</h3>
            <div>
              <div className="form-group">
                <label htmlFor="name">نام کالا</label>
                <input
                  id="name"
                  {...itemRegister("name", { required: "نام کالا الزامی است" })}
                />
                {itemErrors.name && <p className="error-message">{itemErrors.name.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="quantity">تعداد</label>
                <input
                  id="quantity"
                  type="number"
                  {...itemRegister("quantity", { required: "تعداد الزامی است" })}
                />
                {itemErrors.quantity && <p className="error-message">{itemErrors.quantity.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="price">مبلغ</label>
                <input
                  id="price"
                  type="number"
                  {...itemRegister("price", { required: "مبلغ الزامی است" })}
                />
                {itemErrors.price && <p className="error-message">{itemErrors.price.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="description">شرح</label>
                <input id="description" {...itemRegister("description")} />
              </div>

              <button type="button" onClick={() => handleItemSubmit(addItem)()} className="modal-add-btn">
                {editingItemIndex === null ? "افزودن" : "ویرایش"}
              </button>
              <button type="button" onClick={closeModal} className="modal-close-btn">
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      <button type="submit" className="store-btn">
        ثبت فاکتور
      </button>

      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </form>
  );
}


// سلام
// برای راه اندازی پروزه از دستورات زیر استفاده کنید

// 1-npm i
// 2- npm run dev 
// 3-npm run json-server

// در صورت صحت اطلاعات وارد شده در فرم درخواست با موفقیت ارسال خواهد شد..

// db.json تمامی اطلاعات ارسالی در این فایل ذخیره میشوند

// همه منطق پروژه و کدهای آن در یک کامپوننت نوشته شده..
// البته بهتر است که برای سهلوت کار و اصول کلین کد
//  به چندین کامپوننت مجزا تقسیم شود 
// ولی چون هدف فقط پیاده سازی تسک محول شده بود فقط 
// در یک کامپوننت انجام شد.

// تمامی استایل های پروژه در یک فایل استفاده شده 

// موفق و موید باشید

// پوریا مبارکی