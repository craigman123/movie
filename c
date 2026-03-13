<div class="venue-section">
                <!-- Modal -->
                <div id="availability-modal">
                    <div class="modal-content">
                        <div class="calendar-container">
                            <h4>Set Movie Availability</h4>

                            <!-- Single Calendar -->
                            <div class="calendar">
                                <div class="header">
                                    <div id="prev" class="btn"><i class="fa-solid fa-arrow-left"></i></div>
                                    <svg id="prev-year" class="btn2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12.71 16.29 8.41 12l4.3-4.29-1.42-1.42L5.59 12l5.7 5.71z"></path><path d="M16.29 6.29 10.59 12l5.7 5.71 1.42-1.42-4.3-4.29 4.3-4.29z"></path></svg>
                                    <div id="month-year"></div>
                                    <svg id="next-year" class="btn2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="m7.71 17.71 5.7-5.71-5.7-5.71-1.42 1.42 4.3 4.29-4.3 4.29z"></path><path d="m11.29 7.71 4.3 4.29-4.3 4.29 1.42 1.42 5.7-5.71-5.7-5.71z"></path></svg>
                                    <div id="next" class="btn"><i class="fa-solid fa-arrow-right"></i></div>
                                </div>
                                <div class="weekdays">
                                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                                </div>
                                <div class="days" id="days"></div>
                                <input type="hidden" name="venue_date" id="selected-date-input">
                            </div>
                            <div class="time-container">
                                <label class="time-label">Starting Time</label>
                                <input type="time" title="Time" class="time-size" id="time1" name="time_avail" required>
                                <label class="time-label">Ending Time</label>
                                <input type="time" title="Time" class="time-size" id="time2" name="time_avail2" required>
                            </div>

                            <span class="selected-date-time">
                                <p><strong>Date and Time:</strong> <span id="start-date">none</span></p>
                            </span>
                        
                            </div>
                    <div>
                        <button type="button" class="done-btn" id="done-btn">Done</button>
                        <button type="button" class="cancel-btn" id="cancel-btn">Cancel</button>
                    </div>
                </div>
            </div>

            <div class="venue-modal">
                    <div class="venue-modal-content">
                        <span class="close-btn">&times;</span>
                        <h3>Venue Availability</h3>
                        <div class="venue-border">
                            <div class="venue-info"> 
                                <h4>VENUE INFORMATION</h4>
                                <input class="input" name="venue_name" placeholder="Venue Name" type="text" required>
                                    <select title="Availability" class="input" name="venue_availability" required>
                                            <option value="Everyday">Everyday</option>

                                            <option value="M">M</option>
                                            <option value="T">T</option>
                                            <option value="W">W</option>
                                            <option value="TH">TH</option>
                                            <option value="F">F</option>
                                            <option value="S">S</option>
                                            <option value="SU">SU</option>

                                            <option value="MW">MW</option>
                                            <option value="MWF">MWF</option>
                                            <option value="TTH">TTH</option>

                                            <option value="MTW">MTW</option>
                                            <option value="MTWF">MTWF</option>
                                            <option value="TWTH">TWTH</option>

                                            <option value="WF">WF</option>
                                            <option value="MT">MT</option>
                                            <option value="MTH">MTH</option>

                                            <option value="FS">FS</option>
                                            <option value="SSU">SSU</option>

                                            <option value="MTWTHF">Weekdays</option>
                                            <option value="SSU">Weekends</option>
                                    </select>
                                </div>
                            </div>
                            <div class="venue-information-container">
                                <div class="map-border">
                                    <div class="map-link"> 
                                        <h4>MAP LINK</h4>
                                        <input class="input" name="venue_link" placeholder="Venue Link" type="text" required>
                                    </div>
                                    <div class="logoandname">
                                    <header class="head">
                                        <div class="image">
                                            <img src="{{ url_for('static', filename='assets/logo-removebg-preview.png') }}" class="logo" alt="Luma"></img>
                                        </div>
                                    </header>
                                    </div>
                                </div>
                            </div>
                            <div class="bordervenue" id="bordervenue">
                                <div class="file-container"> 
                                    <div class="file-header"> 
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> 
                                        <path d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 15.4806 20.1956 16.8084 19 17.5M7 10C4.79086 10 3 11.7909 3 14C3 15.4806 3.8044 16.8084 5 17.5M7 10C7.43285 10 7.84965 10.0688 8.24006 10.1959M12 12V21M12 12L15 15M12 12L9 15" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg> <p>UPLOAD VENUE IMAGE</p>
                                    </div> 
                                    <label for="filevenue" class="file-footer"> 
                                        <svg fill="#000000" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M15.331 6H8.5v20h15V14.154h-8.169z"></path><path d="M18.153 6h-.009v5.342H23.5v-.002z"></path></g></svg> 
                                        <p>Select file</p> 
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z" stroke="#000000" stroke-width="2"></path> <path d="M19.5 5H4.5" stroke="#000000" stroke-width="2" stroke-linecap="round"></path> <path d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z" stroke="#000000" stroke-width="2"></path> </g></svg>
                                    </label> 
                                    <input id="filevenue" name="venue_image" type="file" accept="image/*" required> 
                                </div>
                            </div>
                            <div class="seat-plan-generator">
                                <h4>SEAT PLAN GENERATOR</h4>
                                <input class="input" name="room" placeholder="Room" type="text" required>
                                
                                <div class="seat-controls">
                                    <label for="rows">Rows (1-26):</label>
                                    <input type="number" id="rows" min="1" max="26" value="10">

                                    <label for="cols">Columns (1-30):</label>
                                    <input type="number" id="cols" min="1" max="30" value="16">

                                    <label for="col-gap">Column Gap every N columns (0 for none):</label>
                                    <input type="number" id="col-gap" min="0" max="10" value="4">

                                    <label for="row-gap">Row Gap every N rows (0 for none):</label>
                                    <input type="number" id="row-gap" min="0" max="10" value="0">

                                    <button type="button" id="generate">Generate Seat Plan</button>
                                </div>

                                    <div id="capacity-info"></div>
                                    <div id="selected-info"></div>

                                    <div>
                                    <label for="zoom">Zoom (%): </label>
                                    <input type="range" id="zoom" min="50" max="200" value="100" /> <span id="zoom-value">100%</span>
                                    </div>

                                    <div id="seat-wrapper">
                                    <div class="seat-box">
                                        <div id="zoom-container">
                                        <div class="cinema-screen">CINEMA SCREEN</div>
                                        <div id="seat-container"></div>
                                        </div>
                                    </div>
                                    </div>

                                    <div class="legend">
                                        <div class="legend-item"><div class="legend-color available-color"></div>Available</div>
                                        <div class="legend-item"><div class="legend-color selected-color"></div>Selected</div>
                                    </div>
                                </div>
                    </div>
                </div>

            <div class="movie_avilability">
                <div class="movie-border">
                    <div class="movie-schedule">
                        <h4>MOVIE AVAILABILITY</h4>
                        <button type="button" class="Btn" id="add-movie-btn">
                            <div class="sign">+</div>
                            <div class="text">Add Movie Schedule</div>
                        </button>
                        <div id="availability-data"></div>
                        <div style="display: none;" id="displayDate" class="displayDate">Add Schedule</div>
                    </div>
                </div>
            </div>

            <div class="venue-availability">
                <div class="venue-border">
                    <div class="venue-schedule">
                        <h4>VENUE AVAILABILITY</h4>
                        <button type="button" class="Btn" id="check-venue-btn">
                            <div class="sign">+</div>
                            <div class="text">Check Venue Availability</div>
                        </button>
                    </div>
                </div>
            </div>

        </div>