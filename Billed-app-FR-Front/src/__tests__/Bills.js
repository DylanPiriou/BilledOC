/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";
import store from "../__mocks__/store.js";

// jest.mock("../__mocks__/store", () => jest.fn());

describe("Given I am connected as an employee", () => {
	describe("When I am on Bills Page, the page is loaded", () => {
		test("Then bill icon in vertical layout should be highlighted", async () => {
			Object.defineProperty(window, "localStorage", {
				value: localStorageMock,
			});
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				})
			);
			const root = document.createElement("div");
			root.setAttribute("id", "root");
			document.body.append(root);
			router();
			window.onNavigate(ROUTES_PATH.Bills);
			await waitFor(() => screen.getByTestId("icon-window"));
			const windowIcon = screen.getByTestId("icon-window");
			expect(windowIcon.className).toBe("active-icon");
		});
		test("Then bills should be fetched from mock API GET", async () => {
			localStorage.setItem(
				"user",
				JSON.stringify({ type: "Employee", email: "test@test.test" })
			);

			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};

			const test = new Bills({
				document,
				onNavigate,
				store: store,
				localStorageMock: window.localStorage,
			});

			const bills = await test.getBills();

			expect(bills.length).toBe(4);
		});
		test("Then bills should be ordered from earliest to latest", () => {
			document.body.innerHTML = BillsUI({ data: bills });
			const dates = screen
				.getAllByText(
					/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
				)
				.map((a) => a.innerHTML);
			const antiChrono = (a, b) => (a < b ? 1 : -1);
			const datesSorted = [...dates].sort(antiChrono);
			expect(dates).toEqual(datesSorted);
		});
	});
	describe("When I am on Bills Page, i can click on bills and create bills", () => {
		test("Then the modal should open when clicking on the eye icon", () => {
			document.body.innerHTML = BillsUI({ data: bills });
			const eyesIcons = screen.getAllByTestId("icon-eye");

			expect(eyesIcons.length).toBeGreaterThan(0);

			eyesIcons.forEach((eyeIcon) => {
				eyeIcon.addEventListener("click", () => {
					const modal = document.getElementById("modaleFile");
					expect(modal).toBeTruthy();
				});

				fireEvent.click(eyeIcon);
			});
		});
		test("Then the button to create new bills should work", () => {
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};

			const test = new Bills({
				document,
				onNavigate,
				store: null,
				bills: bills,
				localStorageMock: window.localStorage,
			});

			document.body.innerHTML = BillsUI({ data: { bills } });

			const newBillButton = screen.getByTestId("btn-new-bill");
			const handleClickNewBill = jest.fn(test.handleClickNewBill);
			newBillButton.addEventListener("click", handleClickNewBill);
			fireEvent.click(newBillButton);
			expect(handleClickNewBill).toHaveBeenCalled();
		});
	});
	describe("When i am on bills page, if bills are not loaded", () => {
		test("Then fetches fails with 404 message error from mock API GET", async () => {
			localStorage.setItem(
				"user",
				JSON.stringify({ type: "Employee", email: "employee@jest.test" })
			);

			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};

			const test = new Bills({
				document,
				onNavigate,
				store: store,
				localStorageMock: window.localStorage,
			});

			try {
				await test.getBills(404);
			} catch (e) {
				expect(e.message).toBe("Erreur 404");
			}
		});
		test("Then fetches fails with 500 message error from mock API GET", async () => {
			localStorage.setItem(
				"user",
				JSON.stringify({ type: "Employee", email: "employee@jest.test" })
			);

			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};

			const test = new Bills({
				document,
				onNavigate,
				store: store,
				localStorageMock: window.localStorage,
			});

			try {
				await test.getBills(500);
			} catch (e) {
				expect(e.message).toBe("Erreur 500");
			}
		});
	});
});
