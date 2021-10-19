const { Transaction } = require('../models')
const midtransClient = require('midtrans-client');

let snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

class Controller {
    static midtransToken(req, res, next) {
        let order_id = "TOP" + +req.body.price +  "TOPBUG" + new Date().toISOString() + "AnonUser"  + req.currentUser.id

        let parameter = {
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": +req.body.price
            }, "credit_card": {
                "secure": true
            }
        }

        snap.createTransaction(parameter)
            .then((transaction) => {
                // transaction token
                res.status(200).json({ transaction });
            })
            .catch(err => {
                res.status(500).json(err)
            })
    }

    static createTransaction(req, res, next) {
        // ex order_id TOP5000TOPBUG1995-12-16T20:24:00.000ZAnonUser1
        let UserId = +req.body.order_id.split('AnonUser')[1]

        Transaction.findAll({
            where: {
                order_id: req.body.order_id,
            },
        })
            .then((result) => {
                if (!result.length) {
                    let input = {
                        order_id: req.body.order_id,
                        status: req.body.transaction_status,
                        price: Number(req.body.gross_amount),
                        UserId,
                    }
                    Transaction.create(input)
                        .then((result) => {
                            res.status(201).json(result)
                        }).catch((err) => {
                            throw err
                        });
                } else {
                    let input = {
                        status: req.body.transaction_status,
                    }
                    Transaction.update(input, {
                        where: {
                            order_id: req.body.order_id,
                        }
                    })
                        .then((result) => {
                            if (result[0]) res.status(200).json({
                                message: 'Transaction succesfully updated'
                            });
                            else throw ({ name: "Transaction Not Found" });
                        }).catch((err) => {
                            throw err
                        });
                }
            }).catch((err) => {
                res.status(500).json(err)
            });
    }

    static viewTransactions(req, res, next) {
        Transaction.findAll({
            where: {
                UserId: req.currentUser.id,
            },
            order: [['createdAt', 'DESC']],
        })
            .then((result) => {
                res.status(200).json(result)
            }).catch((err) => {
                res.status(500).json(err)
            });
    }
}

module.exports = Controller