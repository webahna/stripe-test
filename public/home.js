(async () => {
    const req = await fetch('/config')
    const { publishableKey } = await req.json()

    const stripe = Stripe(publishableKey)

    const req2 = await fetch('/create-payment-intent')
    const { id, clientSecret } = await req2.json()
    const elements = stripe.elements({ clientSecret, })
    const paymentElement = elements.create('payment', {
        layout: {
            type: 'accordion',
            defaultCollapsed: false,
            radios: false,
            spacedAccordionItems: false
        },
    })
    paymentElement.mount('#card-element');

    // const cardholderName = document.getElementById('cardholder-name');
    const form = document.getElementById('payment-form');

    form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const { paymentMethod, error } = await stripe.createPaymentMethod(
            'card',
            paymentElement,
            { billing_details: { name: 'Alejandro Ramirez Quezada' } },
        );
        if (error) {
            console.log(error)
        } else {
            // Send paymentMethod.id to your server (see Step 2)
            const response = await fetch('/collect_details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentIntentId: id,
                    payment_method_id: paymentMethod.id
                }),
            });

            const json = await response.json();
            console.log(json)

            // Handle server response (see Step 3)

            const selectPlanForm = document.getElementById('installment-plan-form');
            let availablePlans = [];
            handleInstallmentPlans(json);

            async function handleInstallmentPlans(response) {
                if (response.error) {
                    console.log(error)
                } else {
                    // Store the payment intent ID.
                    document.getElementById('payment-intent-id').value = response.intent_id;
                    availablePlans = response.available_plans;

                    // Show available installment options
                    availablePlans.forEach((plan, idx) => {
                        const newInput = document.getElementById('immediate-plan').cloneNode();
                        newInput.setAttribute('value', idx);
                        newInput.setAttribute('id', '');
                        const label = document.createElement('label');
                        label.appendChild(newInput);
                        label.appendChild(
                            document.createTextNode(`${plan.count} ${plan.interval}s`),
                        );

                        selectPlanForm.appendChild(label);
                    });

                    document.getElementById('details').hidden = true;
                    document.getElementById('plans').hidden = false;
                }
            };

            const confirmButton = document.getElementById('confirm-button');

            confirmButton.addEventListener('click', async (ev) => {
                const selectedPlanIdx = selectPlanForm.installment_plan.value;
                const selectedPlan = availablePlans[selectedPlanIdx];
                const intentId = document.getElementById('payment-intent-id').value;
                const response = await fetch('/confirm_payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        payment_intent_id: intentId,
                        selected_plan: selectedPlan,
                    }),
                });

                const responseJson = await response.json();

                // Show success / error response.
                document.getElementById('plans').hidden = true;
                document.getElementById('result').hidden = false;

                var message;
                if (responseJson.status === "succeeded" && selectedPlan !== undefined) {
                    message = `Success! You made a charge with this plan:${selectedPlan.count
                        } ${selectedPlan.interval}`;
                } else if (responseJson.status === "succeeded") {
                    message = "Success! You paid immediately!";
                } else {
                    message = "Uh oh! Something went wrong";
                }

                document.getElementById("status-message").innerText = message;
            });
        }
    });
})()