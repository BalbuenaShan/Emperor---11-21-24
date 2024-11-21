import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Books.css';

const CustBook = () => {
    const [bookings, setBookings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const response = await axios.get('http://localhost:3030/bookings');
                setBookings(response.data);
            } catch (error) {
                console.error("Error fetching bookings:", error);
            }
        };

        fetchBookings();
    }, []);

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:3030/bookings/delete/${id}`);
            setBookings(prevBookings => prevBookings.filter((booking) => booking.id !== id));
        } catch (error) {
            console.error("Error deleting booking:", error);
        }
    };

    const handleLogout = () => {
        navigate('/');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return format(date, 'MMMM dd, yyyy');
    };

    const formatTime = (timeString) => {
        const date = new Date(`1970-01-01T${timeString}`);
        return format(date, 'hh:mm a');
    };

    const filteredBookings = bookings.filter((booking) =>
        booking.id.toString().includes(searchTerm) ||
        booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.staffName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-fluid">
            <div className="row">
                {/* Sidebar */}
                <nav className="col-md-2 bg-dark sidebar">
                    <div className="text-white text-center py-3">
                        <h4>Emperor's Lounge</h4>
                    </div>
                    <hr className="text-white" />
                    <div className="d-flex flex-column align-items-center">
                        <button className="nav-link text-white btn btn-link" onClick={() => navigate('/admin')}>
                            <i className="fas fa-home"></i> Dashboard
                        </button>
                        <button className="nav-link text-white btn btn-link" onClick={() => navigate('/custbook')}>
                            <i className="fas fa-calendar-alt"></i> Customer's Booking
                        </button>
                        <button className="nav-link text-white btn btn-link" onClick={() => navigate('/payments')}>
                            <i className="fas fa-credit-card"></i> Payment
                        </button>
                        <button className="nav-link text-white btn btn-link" onClick={handleLogout}>
                            <i className="fas fa-sign-out-alt"></i> Log out
                        </button>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="col-md-10 mt-5">
                <div className="header-search-container mb-4">
            <h2 className="text-center">Customer's Booking</h2>
            <div className="search-bar">
            <input
                type="text"
                className="form-control"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search" />
            </div>
        </div>

                    {/* Booking Table */}
                    <div className="card">
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-striped">
                                    <thead className="thead-dark">
                                        <tr>
                                            <th>Booking ID</th>
                                            <th>Customer Name</th>
                                            <th>Service</th>
                                            <th>Staff Name</th>
                                            <th>Service Price</th>
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBookings.length > 0 ? (
                                            filteredBookings.map((booking) => (
                                                <tr key={booking.id}>
                                                    <td>{booking.id}</td>
                                                    <td>{booking.customerName}</td>
                                                    <td>{booking.serviceType}</td>
                                                    <td>{booking.staffName}</td>
                                                    <td>₱{booking.servicePrice.toFixed(2)}</td>
                                                    <td>{formatDate(booking.date)}</td>
                                                    <td>{formatTime(booking.time)}</td>
                                                    <td>
                                                        <button className="btn btn-danger" onClick={() => handleDelete(booking.id)}>
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="8">No Records</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CustBook;