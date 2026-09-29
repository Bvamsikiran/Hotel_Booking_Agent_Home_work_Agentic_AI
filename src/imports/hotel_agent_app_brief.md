# App Brief: Corporate Hotel Booking Agent

Design and build a web app called **"StayGuard"**. It shows how a hotel-booking AI grows from a simple chatbot into an agent that plans, checks its own work, and books a hotel within company rules.

## 1. The one goal the app is built around

> "Book me a hotel in Paris for 3 nights starting next week, within the company travel policy and a Rs 45,000 total budget."

Everything in the app helps the user watch this goal being solved step by step.

## 2. The idea (six stages, each adds one ability)

| Stage | What it adds | Simple meaning |
|---|---|---|
| LLM | Generation | Can write an answer, but may make things up |
| RAG | Knowledge | Looks up the company hotel policy before answering |
| Assistant | Context | Remembers what was said earlier in the chat |
| Tools | Actions | Can search hotels and check rules |
| Workflow | Fixed order | Runs the same steps every time (can miss things) |
| Agent | Decisions | The AI chooses the next step, and code verifies the result |

Show this as a horizontal progress ladder at the top of the app. The user can click each stage to see that mode.

## 3. Screens to design

**Screen 1: Policy Assistant (RAG + context)**
- Chat window. Left side has a "Policy excerpts used" panel showing the top 3 policy chunks with similarity scores (for example 0.62).
- Each answer ends with a clause citation like [6.2].
- A small "Conversation memory" strip shows the message list growing turn by turn.
- Sample questions: "I'm grade L4 staying in Paris next week." then "Can I book a deluxe room?" then "What is my daily allowance?"

**Screen 2: Agent Run (main screen)**
- Top: goal input, total budget field (default Rs 45,000), employee grade dropdown (L1-L7, default L4), city dropdown (Paris, London, Dubai, Singapore, default Paris), check-in date picker (default 2 days from today), number of nights (default 3), "Run agent" button.
- Center: a vertical live trace. Each step is a card with three rows: THINK (why), ACT (tool name plus arguments), SEE (result). Cards appear one at a time with a step counter "Step 3 of 10".
- Right: "Verified" badge that stays grey until check_policy returns compliant = true, then turns green.
- Bottom: final answer card (hotel name, city, check-in and check-out dates, room type, nightly rate, total cost, "within budget" chip).

**Screen 3: Tools (MCP server view)**
- Three tool cards discovered at runtime:
  - retrieve_policy(query): searches the company hotel policy. Must be called before proposing anything.
  - search_hotels(city, checkin_date, nights, room_type): returns nightly rates in INR for four hotels, sorted cheapest first.
  - check_policy(room_type, checkin_date, employee_grade, nightly_rate_inr, cheapest_compliant_rate_inr): returns compliant true/false and a list of violations.
- Each card has a "Try it" form and shows the raw result.

**Screen 4: Workflow vs Agent**
- Two columns side by side, same goal, check-in in 2 days.
- Workflow column: 3 fixed calls (search, pick cheapest, book), result "within budget" but a red warning "Nobody checked the policy: booking window violated."
- Agent column: catches the violation, moves the check-in date, re-searches, passes check, shows green "Verified".
- Key message: "Within budget and non-compliant, with total confidence."

**Screen 5: Memory**
- Three cards: Conversation state (lives for one chat thread), Task state (lives for one run: policy retrieved, compliance PASS/not verified, steps used), Long-term memory (across sessions: grade L4, home city Mumbai, last booking rejected for late booking).

## 4. Rules and data to simulate (no real AI needed for the prototype)

**Cities:** Paris, London, Dubai, Singapore (same rate rules for all cities in the prototype).
**Hotels (fictional):** Hotel Lumiere, Seine Grand, Marais Boutique, Gare du Nord Inn.

**Rate rule (mock):**
- base nightly rate = Rs 9,000 + Rs 600 for every day fewer than 10 days before check-in
- deluxe room = base x 1.6, suite = base x 2.8
- each hotel adds a random amount between -1,000 and +4,000 per night
- total cost = nightly rate x number of nights
- show money with Indian grouping, for example Rs 9,500 or Rs 1,19,700

**Company hotel policy (mock, used by check_policy):**
- 6.1 Booking window: hotels must be booked at least 7 days before check-in.
- 6.2 Room type: standard room for grades L1-L4. Deluxe needs grade L5 or above. Suite needs L7 plus VP approval.
- 6.3 Lowest logical rate: the chosen nightly rate cannot be more than 15% above the cheapest compliant rate.
- 6.4 Daily allowance: Rs 4,500 per day for meals and local travel on international trips, receipts required.

## 5. How the agent behaves (show this in the trace)

Rules the agent follows:
1. Retrieve the policy first, using the rule name as the query (for example "hotel booking window").
2. Call exactly one tool per step.
3. It may not finish until check_policy returns compliant = true. If it tries, show a red "Tried to finish without check_policy" card and send it back once.
4. If check_policy reports violations, fix the cause (move the check-in date, or change the room type) and search again.
5. Prefer the cheapest compliant rate.
6. Stop the moment check_policy passes. Maximum 10 steps.
7. A failed tool call is shown as an observation, not a crash. A repeated identical call shows "Already called with these arguments. Move on."

**Example run to animate (check-in in 2 days, grade L4, standard room, 3 nights, Paris):**
1. THINK: policy first. ACT: retrieve_policy("hotel booking window"). SEE: clause 6.1 says 7 days.
2. THINK: check the plan. ACT: check_policy(standard, check-in in 2 days). SEE: violation "6.1 booking window: check-in is in 2 days, policy requires 7".
3. THINK: move the date. ACT: search_hotels(Paris, check-in in 8 days, 3 nights, standard). SEE: four hotels, cheapest about Rs 9,500 to Rs 10,500 per night.
4. ACT: check_policy(standard, check-in in 8 days, nightly rate). SEE: compliant true.
5. DONE: final answer with hotel, dates, room type, nightly rate, total. Verified badge turns green.

## 6. Design direction

- Clean, professional business-travel feel. Light background, one strong accent color (deep blue), green for pass, red for violations, amber for warnings.
- Card-based layout, generous spacing, clear typography. Monospace font only for tool names and arguments.
- Make THINK / ACT / SEE visually distinct (different icon and tint) so a beginner can follow the loop.
- Include empty, loading, error, and success states. Animate trace cards appearing one by one.
- Desktop first, with a responsive mobile layout.
- Use simple plain-language labels. This app is for learning, so add a short "What just happened?" caption under each step.

## 7. Build notes

- For this prototype, simulate the agent with scripted responses following the example run above, but keep the code structured as think, act, observe, remember so a real AI model can be plugged in later.
- Keep the three tools as separate functions with clear inputs and outputs, so they can later be moved to a real server.
