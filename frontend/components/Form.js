import React, { useEffect, useState } from 'react';
import * as yup from 'yup';
import axios from 'axios';

// 👇 Here are the validation errors you will use with Yup.
const validationErrors = {
  fullNameTooShort: 'full name must be at least 3 characters',
  fullNameTooLong: 'full name must be at most 20 characters',
  sizeIncorrect: 'size must be S or M or L'
}

// 👇 Here you will create your schema.

// 👇 This array could help you construct your checkboxes using .map in the JSX.
const toppings = [
  { topping_id: '1', text: 'Pepperoni' },
  { topping_id: '2', text: 'Green Peppers' },
  { topping_id: '3', text: 'Pineapple' },
  { topping_id: '4', text: 'Mushrooms' },
  { topping_id: '5', text: 'Ham' },
]

export default function Form() {
  // Initial values
  const initialFormValues = {
    fullName: '',
    size: '',
    toppings: [] // Store topping_ids here
  };
  const initialFormErrors = {
    fullName: '',
    size: ''
  };

  // State
  const [formValues, setFormValues] = useState(initialFormValues);
  const [formErrors, setFormErrors] = useState(initialFormErrors);
  const [successMessage, setSuccessMessage] = useState('');
  const [failureMessage, setFailureMessage] = useState('');
  const [submitEnabled, setSubmitEnabled] = useState(false);

  // Yup schema
  const formSchema = yup.object().shape({
    fullName: yup.string()
      .trim()
      .min(3, validationErrors.fullNameTooShort)
      .max(20, validationErrors.fullNameTooLong)
      .required('Full name is required'),
    size: yup.string()
      .oneOf(['S', 'M', 'L'], validationErrors.sizeIncorrect)
      .required('Size is required'),
    toppings: yup.array().of(yup.string())
  });

  const handleChange = (evt) => {
    let { name, value } = evt.target;
    // For fullName, trim whitespace as per server validation rule
    if (name === 'fullName') {
      value = value.trim(); 
    }

    setFormValues({ ...formValues, [name]: value });

    yup.reach(formSchema, name)
      .validate(value)
      .then(() => {
        setFormErrors({ ...formErrors, [name]: '' });
      })
      .catch(err => {
        setFormErrors({ ...formErrors, [name]: err.errors[0] });
      });
  };

  const handleCheckboxChange = (evt) => {
    const { name, checked } = evt.target; // 'name' will be the topping_id
    let updatedToppings = [...formValues.toppings];
    if (checked) {
      if (!updatedToppings.includes(name)) {
        updatedToppings.push(name);
      }
    } else {
      updatedToppings = updatedToppings.filter(toppingId => toppingId !== name);
    }
    setFormValues({ ...formValues, toppings: updatedToppings });
    // Optional: Validate toppings array if specific rules apply (e.g., max number of toppings)
    // For now, the main validation is on submit for the overall form structure.
  };

  const handleSubmit = (evt) => {
    evt.preventDefault();
    // Ensure fullName is trimmed for submission as per server rules
    const payload = {
      ...formValues,
      fullName: formValues.fullName.trim(), 
    };

    axios.post('http://localhost:9009/api/order', payload)
      .then(res => {
        setSuccessMessage(res.data.message);
        setFailureMessage('');
        setFormValues(initialFormValues);
        setFormErrors(initialFormErrors); 
        // The submit button will be disabled by useEffect due to formValues change
      })
      .catch(err => {
        setFailureMessage(err.response?.data?.message || 'Something went wrong with your order.');
        setSuccessMessage('');
      });
  };

  // useEffect for form validation to enable/disable submit
  useEffect(() => {
    formSchema.isValid(formValues).then(valid => {
      setSubmitEnabled(valid);
    });
  }, [formValues, formSchema]);

  return (
    <form onSubmit={handleSubmit}>
      <h2>Order Your Pizza</h2>
      {successMessage && <div className='success'>{successMessage}</div>}
      {failureMessage && <div className='failure'>{failureMessage}</div>}

      <div className="input-group">
        <div>
          <label htmlFor="fullName">Full Name</label><br />
          <input placeholder="Type full name" id="fullName" type="text" name="fullName" value={formValues.fullName} onChange={handleChange} />
        </div>
        {formErrors.fullName && <div className='error'>{formErrors.fullName}</div>}
      </div>

      <div className="input-group">
        <div>
          <label htmlFor="size">Size</label><br />
          <select id="size" name="size" value={formValues.size} onChange={handleChange}>
            <option value="">----Choose Size----</option>
            <option value="S">Small</option>
            <option value="M">Medium</option>
            <option value="L">Large</option>
          </select>
        </div>
        {formErrors.size && <div className='error'>{formErrors.size}</div>}
      </div>

      <div className="input-group">
        <label>Toppings:</label><br />
        {
          toppings.map(topping => (
            <label key={topping.topping_id} style={{ marginRight: '10px' }}>
              <input
                type="checkbox"
                name={topping.topping_id}
                checked={formValues.toppings.includes(topping.topping_id)}
                onChange={handleCheckboxChange}
              />
              {topping.text}<br />
            </label>
          ))
        }
      </div>
      {/* 👇 Make sure the submit stays disabled until the form validates! */}
      <input type="submit" disabled={!submitEnabled} />
    </form>
  )
}
