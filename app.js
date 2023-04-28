import express from 'express'
import dotenv from 'dotenv';
import Stripe from 'stripe';

const stripe = Stripe('sk_test_51Mj62HGujNA0IK1bEd3NaTpEzV5x3NV5askpYMku0RjkulZH5KMrisrmJH6WlmY3VQ7lcXO19GVDbudntY7fIT8x00S469plYG');


dotenv.config({ path: '.env' })
const app = express();


app.set('view engine', 'pug'); // Activamos el motor de vista pug
app.set('views', './views'); //Le decimos donde estan guardadas las vistas

app.use(express.static('public'))

//Habilitar lectura de formularios
app.use(express.urlencoded({ extended: true }));

app.use(express.json());


app.get('/', async (req, res) => {
    const paymentMethods = await stripe.customers.listPaymentMethods('cus_NcUeM7T81paZsZ',
        { type: 'card' }
    );
    res.render('home', {
        paymentMethods: paymentMethods.data
    })
})

app.get('/config', (req, res) => {
    res.send({
        publishableKey: 'pk_test_51Mj62HGujNA0IK1b3jh6Z02ewmPIXsW7B3WicXh1j76dHXior5tLSudQYV4ITrcKGN58rJB04CgqtcgjNZAcbxOz00kwsj2T6u'
    })
})

app.get('/create-setup-intent', async (req, res) => {
    try {
        const setupIntent = await stripe.setupIntents.create({
            payment_method_types: ['card'],
            customer: 'cus_NcUeM7T81paZsZ'
        });

        return res.send({ setuptIntentId: setupIntent.id, clientSecret: setupIntent.client_secret })
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

app.post('/confirm-setup-intent', async (req, res) => {
    const { setupIntentId, paymentMethodId } = req.body
    try {
        const setupIntent = await stripe.setupIntents.confirm(setupIntentId, {
            payment_method: paymentMethodId,
            return_url: 'http://localhost:4005/complete'
        });
        return res.send(setupIntent)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }

})

app.post('/create-payment-intent', async (req, res) => {
    const { paymentMethodId } = req.body
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 222222,
            currency: 'mxn',
            customer: 'cus_NcUeM7T81paZsZ',
            payment_method: paymentMethodId,
            payment_method_options: {
                card: {
                    installments: {
                        enabled: true,
                    },
                },
            },
            off_session: false
        });
        return res.send({ paymentIntentId: paymentIntent.id, available_plans: paymentIntent.payment_method_options.card.installments.available_plans })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})

app.post('/confirm-payment-intent', async (req, res) => {
    const { paymentIntentId, plan } = req.body
    let confirmPaymentIntent
    try {
        if (plan) {
            confirmPaymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
                payment_method_options: {
                    card: {
                        installments: {
                            plan
                        },
                    },
                },
                return_url: 'http://localhost:4005/complete'
            })
        } else {
            confirmPaymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
                return_url: 'http://localhost:4005/complete'
            })
        }

        return res.send(confirmPaymentIntent)
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
})

app.get('/complete', async (req, res) => {
    // Simulando que este paymentIntentId viene del checkout y no de los querys de la url
    const { payment_intent } = req.query

    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent)
    console.log(paymentIntent)
    return res.render('complete', {
        pagina: 'Pago completo',
        paymentIntent
    })


})



const PORT = 4005
app.listen(PORT, () => {
    console.log('Servidor listo en el puerto ', PORT)
});