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

app.get('/', (req, res) => {
    res.render('home')
})

app.post('/collect_details', async (req, res) => {
    const {paymentIntentId, payment_method_id} = req.body
    try {
        const intent = await stripe.paymentIntents.update(paymentIntentId ,{
            payment_method: payment_method_id,
            payment_method_options: {
                card: {
                    installments: {
                        enabled: true,
                    },
                },
            },
        });

        return res.json({
            intent_id: intent.id,
            available_plans: intent.payment_method_options.card.installments.available_plans,
        });
    } catch (err) {
        // "err" contiene un mensaje que explica por qué falló la solicitud
        return res.status(500).json({ error: err.message });
    }
})

app.post('/confirm_payment', async (req, res) => {
    // console.log(req.body)
    try {
        let confirmData = {};
        if (req.body.selected_plan !== undefined) {
            confirmData = {
                payment_method_options: {
                    card: {
                        installments: {
                            plan: req.body.selected_plan,
                        },
                    },
                },
            };
        }

        const intent = await stripe.paymentIntents.confirm(
            req.body.payment_intent_id,
            confirmData,
        );

        return res.send({ success: true, status: intent.status });
    } catch (err) {
        return res.status(500).send({ error: err.message });
    }
})

app.get('/config', (req, res) => {
    res.send({
        publishableKey: 'pk_test_51Mj62HGujNA0IK1b3jh6Z02ewmPIXsW7B3WicXh1j76dHXior5tLSudQYV4ITrcKGN58rJB04CgqtcgjNZAcbxOz00kwsj2T6u'
    })
})
app.get('/create-payment-intent', async (req, res) => {
    // console.log(req.body)
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 300000,
            currency: 'mxn',
            automatic_payment_methods: { enabled: true },
            // customer: customer.id
        });
        console.log(paymentIntent)

        // Podríamos confirmar sin cuotas si no hay planes disponibles,
        // pero démosle al usuario la oportunidad de elegir una tarjeta diferente
        // si las cuotas no están disponibles.
        // console.log(intent)
        return res.send({
            id: paymentIntent.id,
            clientSecret: paymentIntent.client_secret
        })
    } catch (err) {
        console.log(err)
        // "err" contiene un mensaje que explica por qué falló la solicitud
        return res.status(500).json({ error: err.message });
    }
})

const PORT = 4005
app.listen(PORT, () => {
    console.log('Servidor listo en el puerto ', PORT)
});