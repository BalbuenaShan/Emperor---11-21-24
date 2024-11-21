import { createContext, useState } from 'react';

export const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
    const [formData, setFormData] = useState({
        name: '',
        service: '',
        date: new Date(),
        time: '',
        paymentMethod: '',
        email: '',
        price: 0, // Add price to the initial state
    });

    return (
        <BookingContext.Provider value={{ formData, setFormData }}>
            {children}
        </BookingContext.Provider>
    );
};
