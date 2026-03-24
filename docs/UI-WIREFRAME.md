# BOATLY - UI Wireframe (20+ Screens)

## Customer Side (20 Screens)

### Screen 1: Home
- Hero banner
- Search destination
- Featured tours
- Popular boats
- Reviews carousel

### Screen 2: Destination List
- Ayutthaya | Bangkok | Phuket | Krabi
- Status: active / coming_soon
- Grid or list view

### Screen 3: Destination Detail
- Boat listings
- Map preview
- Reviews summary

### Screen 4: Boat Listing Grid
- Boat cards (image, name, price, rating)
- Filter: province, boat type, price range
- Sort: price, rating, popularity

### Screen 5: Boat Detail
- Image gallery (swipe)
- Description
- Capacity, duration, route
- Add-ons
- Book button
- Reviews section

### Screen 6: Calendar
- Select date
- Available dates highlighted
- Month navigation

### Screen 7: Time Slot
- Morning | Afternoon | Sunset
- Time slots from operator config

### Screen 8: Passenger Selection
- Adults (+)
- Children (+)
- Infants (+)

### Screen 9: Special Requests
- Checkbox options
- Notes textarea

### Screen 10: Booking Summary
- Boat name
- Date, time
- Passengers
- Add-ons
- Pier location + GPS
- Total amount

### Screen 11: Payment
- QR Code (PromptPay)
- Credit card
- COD (Pay at pier)

### Screen 12: Booking Confirmation
- Booking ID
- Share button
- Map to pier
- Navigate link

### Screen 13: Map Boarding Point
- Leaflet map
- Pier marker
- Current location

### Screen 14: Boat Approaching (Live)
- Live boat location
- ETA
- Progress indicator

### Screen 15: Profile
- Avatar, name
- Stats: trips, reviews, favorites
- Menu: Edit, Bookings, Favorites, Notifications, Language, Logout

### Screen 16: Booking History
- Tabs: All | Pending | Confirmed | Completed | Cancelled
- Booking cards
- Detail view on tap

### Screen 17: Favorites
- Saved boat cards
- Remove (heart icon)
- Tap → Boat detail

### Screen 18: Review Form
- Star rating (1–5)
- Comment textarea
- Photo upload (max 5)

### Screen 19: Review Gallery
- Grid of review images
- Lightbox view

### Screen 20: Language Selection
- Thai | English | Chinese | Korean | French
- Flag icons

---

## Admin Side (4 Screens)

### Screen 21: Admin Dashboard
- Bookings summary
- Revenue chart
- Operators count
- Quick actions

### Screen 22: Boat Management
- CRUD boats
- Images
- Availability
- Add-ons

### Screen 23: Booking Management
- List all bookings
- Filter by status
- Detail view
- Cancel/Refund

### Screen 24: Operator Management
- List operators
- Approve/Suspend
- Edit company info

---

## Navigation Flow

```
Home → [Search] → Destination List → Destination Detail
                    ↓
              Boat Listing → Boat Detail → [Book]
                    ↓
              Calendar → Time Slot → Passengers → Add-ons
                    ↓
              Summary → Payment → Confirmation
                    ↓
              Map → Boarding Point → (Live) Boat Approaching

Profile → Edit Profile | Bookings | Favorites | Notifications
```

---

## Component Mapping (Current PWA)

| Wireframe Screen | Current Implementation |
|------------------|------------------------|
| Home | `index.html` hero + search + recommendations |
| Destination List | `toursPanel` with filter chips |
| Boat Listing | `toursPanel` grid |
| Boat Detail | `tourDetailPanel` |
| Calendar | `#step1` booking step |
| Time Slot | `#step2` |
| Passengers | `#step3` |
| Add-ons | `#step4` |
| Summary | `#step5` |
| Payment | `#step6` + QR modal |
| Confirmation | `successModal` |
| Map | `mapPanel` |
| Profile | `profilePanel` |
| Bookings | `bookingsPanel` |
| Favorites | `favoritesPanel` |
| Notifications | `notifPanel` |
| Review Form | `reviewModal` |
| Language | `langPickerModal` |
| Admin | `admin.html` |
