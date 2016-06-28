let id_counter = 0
function Book(name, pub, author, year, avail, total) {
    return {
        _id:  ++id_counter,
        title: name,
        publisher: pub,
        author: author,
        year: year,
        available: avail,
        total: total
    }
}

const books = [
    Book('黑黑带你学JS', '大丧失pub', '黑黑黑', 2016, 0, 3),
    Book('黑黑带你学H5', '大丧失pub', '黑黑黑', 2015, 2, 3),
    Book('找不到对象', 'boomboomboom', 'std::weak', 2017, 1, 3)
]

function Reservation(_id, date) {
    return {
        _id:   _id,
        title: books.find( $ => $._id === _id ).title,
        date:  date
    }
}

const reservations_u1 = [
    Reservation(1, Date.now() + 86400000),
    Reservation(2, Date.now() + 86400000*3)
]

const reservations_u2 = [
]

export default {
    login() {
        return {
            status: 'ok',
            data: {
                uid:   1,
                uname: 'test-user'
            }
        }
    },
    logout() {
        return {
            status: 'ok'
        }
    },
    register() {
        return {
            status: 'ok'
        }
    },
    viewReservation() {
        return {
            status: 'ok',
            data: reservations_u1
        }
    },
    query() {
        return {
            status: 'ok',
            data:   books
        }
    },
    reserve() {
        return {
            status: 'ok'
        }
    },
    showPopular() {
        return {
            status: 'ok',
            data:   [books[0]]
        }
    }
}