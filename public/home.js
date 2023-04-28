(async () => {
    const buttonAddCard = document.querySelector('#add-card')
    const containerCards = document.querySelector('#cards')
    const containerAddCard = document.querySelector('#addCard')
    const buttonNext = document.querySelector('#next')
    const buttonPay = document.querySelector('#pay')

    // Solicitar al servidor la clave publica de la cuenta stripe
    const req = await fetch('/config')
    const { publishableKey } = await req.json()
    const stripe = Stripe(publishableKey)

    buttonAddCard.addEventListener('click', async () => {
        const response = await fetch('/create-setup-intent')

        const result = await response.json()

        const elements = stripe.elements({ clientSecret: result.clientSecret })

        const paymentElement = elements.create('payment', {
            layout: {
                type: 'accordion',
                defaultCollapsed: false,
                radios: false,
                spacedAccordionItems: false
            },
        })

        containerCards.classList.add('hidden')
        containerAddCard.classList.remove('hidden')
        paymentElement.mount('#card-element');

        document.querySelector('form').addEventListener('submit', async e => {
            e.preventDefault()
            const { paymentMethod, error } = await stripe.createPaymentMethod(
                'card',
                paymentElement,
                {
                    billing_details: {
                        email: 'alexrmzqzda@gmail.com',
                        name: 'Alejandro Ramirez Quezada',
                        phone: 6681940855
                    }
                }
            );

            if (error) {
                document.querySelector('#errors').classList.remove('hidden')
                document.querySelector('#errors').innerHTML = ''
                document.querySelector('#errors').innerHTML = error.message
            }

            const response2 = await fetch('/confirm-setup-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    paymentMethodId: paymentMethod.id,
                    setupIntentId: result.setuptIntentId
                })
            })

            const result2 = await response2.json()

            if (result2.error) {
                document.querySelector('#errors').classList.remove('hidden')
                document.querySelector('#errors').innerHTML = ''
                document.querySelector('#errors').innerHTML = result2.error
                return
            }

            if (result2.next_action) {
                window.location = result2.next_action.redirect_to_url.url
                return
            }

            window.location.reload()
        })
    })

    if (buttonNext) {
        buttonNext.addEventListener('click', async () => {
            const input = document.querySelector('input[name="paymentMethod"]:checked')
            if (!input) {
                document.querySelector('#errors').classList.remove('hidden')
                document.querySelector('#errors').innerHTML = ''
                document.querySelector('#errors').innerHTML = 'Selecciona una tarjeta'
                setTimeout(() => {
                    document.querySelector('#errors').classList.add('hidden')
                }, 3000)
                return
            }

            // mandar al servidor el paymentMethodId para crear un intentPayment

            const response = await fetch('/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentMethodId: input.value
                })
            })

            const result = await response.json()

            if (result.error) {
                document.querySelector('#errors').classList.remove('hidden')
                document.querySelector('#errors').innerHTML = ''
                document.querySelector('#errors').innerHTML = result.error
                return
            }

            containerCards.classList.add('hidden')
            containerAddCard.classList.add('hidden')
            buttonPay.classList.remove('hidden')
            document.querySelector('#plans').classList.remove('hidden')


            result.available_plans.forEach((plan, idx) => {
                const label = document.createElement('label')
                label.classList.add('w-full', 'p-4', 'rounded-lg', 'bg-[#F2F2F2]', 'flex', 'justify-between', 'items-center', 'gap-4', 'text-xs')
                label.for = `plan${idx}`

                const div = document.createElement('div')
                div.classList.add('flex', 'gap-4')

                const input = document.createElement('input')
                input.type = 'radio'
                input.name = 'plan'
                input.id = `plan${idx}`
                input.value = idx

                const span = document.createElement('span')
                span.textContent = `${plan.count} pagos`

                div.appendChild(input)
                div.appendChild(span)

                label.appendChild(div)

                document.querySelector('#plans').appendChild(label)

            })



            buttonPay.addEventListener('click', async () => {
                const plan = document.querySelector('input[name="plan"]:checked')
                if (!plan) {
                    document.querySelector('#errors').classList.remove('hidden')
                    document.querySelector('#errors').innerHTML = ''
                    document.querySelector('#errors').innerHTML = 'Selecciona un plan de cuotas'
                    setTimeout(() => {
                        document.querySelector('#errors').classList.add('hidden')
                    }, 3000)
                    return
                }

                const response2 = await fetch('/confirm-payment-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentIntentId: result.paymentIntentId,
                        plan: result.available_plans[plan.value]
                    })
                })

                const result2 = await response2.json()

                if (result2.error) {
                    document.querySelector('#errors').classList.remove('hidden')
                    document.querySelector('#errors').innerHTML = ''
                    document.querySelector('#errors').innerHTML = result2.error
                    return
                }

                if (result2.next_action) {
                    window.location = result2.next_action.redirect_to_url.url
                    return
                }

                containerCards.parentElement.innerHTML = result2.status
            })
        })
    }



























    // const req2 = await fetch('/create-payment-intent')
    // const { id, clientSecret } = await req2.json()
    // const elements = stripe.elements({ clientSecret })
    // const paymentElement = elements.create('payment', {
    //     layout: {
    //         type: 'accordion',
    //         defaultCollapsed: false,
    //         radios: false,
    //         spacedAccordionItems: false
    //     },
    // })
    // paymentElement.mount('#card-element');

    // // const cardholderName = document.getElementById('cardholder-name');
    // const form = document.getElementById('payment-form');

    // form.addEventListener('submit', async (ev) => {
    //     ev.preventDefault();
    //     const { paymentMethod, error } = await stripe.createPaymentMethod(
    //         'card',
    //         paymentElement,
    //         { billing_details: { name: 'Alejandro Ramirez Quezada' } },
    //     );
    //     if (error) {
    //         console.log(error)
    //     } else {
    //         // Send paymentMethod.id to your server (see Step 2)
    //         const response = await fetch('/collect_details', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({
    //                 paymentIntentId: id,
    //                 payment_method_id: paymentMethod.id
    //             }),
    //         });

    //         const json = await response.json();
    //         console.log(json)

    //         // Handle server response (see Step 3)

    //         const selectPlanForm = document.getElementById('installment-plan-form');
    //         let availablePlans = [];
    //         handleInstallmentPlans(json);

    //         async function handleInstallmentPlans(response) {
    //             if (response.error) {
    //                 console.log(error)
    //             } else {
    //                 // Store the payment intent ID.
    //                 document.getElementById('payment-intent-id').value = response.intent_id;
    //                 availablePlans = response.available_plans;

    //                 // Show available installment options
    //                 availablePlans.forEach((plan, idx) => {
    //                     const newInput = document.getElementById('immediate-plan').cloneNode();
    //                     newInput.setAttribute('value', idx);
    //                     newInput.setAttribute('id', '');
    //                     const label = document.createElement('label');
    //                     label.appendChild(newInput);
    //                     label.appendChild(
    //                         document.createTextNode(`${plan.count} ${plan.interval}s`),
    //                     );

    //                     selectPlanForm.appendChild(label);
    //                 });

    //                 document.getElementById('details').hidden = true;
    //                 document.getElementById('plans').hidden = false;
    //             }
    //         };

    //         const confirmButton = document.getElementById('confirm-button');

    //         confirmButton.addEventListener('click', async (ev) => {
    //             const selectedPlanIdx = selectPlanForm.installment_plan.value;
    //             const selectedPlan = availablePlans[selectedPlanIdx];
    //             const intentId = document.getElementById('payment-intent-id').value;
    //             const response = await fetch('/confirm_payment', {
    //                 method: 'POST',
    //                 headers: { 'Content-Type': 'application/json' },
    //                 body: JSON.stringify({
    //                     payment_intent_id: intentId,
    //                     selected_plan: selectedPlan,
    //                 }),
    //             });

    //             const responseJson = await response.json();

    //             // Show success / error response.
    //             document.getElementById('plans').hidden = true;
    //             document.getElementById('result').hidden = false;

    //             var message;
    //             if (responseJson.status === "succeeded" && selectedPlan !== undefined) {
    //                 message = `Success! You made a charge with this plan:${selectedPlan.count
    //                     } ${selectedPlan.interval}`;
    //             } else if (responseJson.status === "succeeded") {
    //                 message = "Success! You paid immediately!";
    //             } else {
    //                 message = "Uh oh! Something went wrong";
    //             }

    //             document.getElementById("status-message").innerText = message;
    //         });
    //     }
    // });
})()