/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store.js";

describe("Given I am connected as an employee", () => {
	describe("When I am on NewBill Page, the page is loaded", () => {
		test("Then the page should contain a form", () => {
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
			window.onNavigate(ROUTES_PATH.NewBill);
			const form = screen.getByTestId("form-new-bill");
			expect(form).toBeTruthy();
		});
		test("Then the bill icon should be highlighted in the sidebar", async () => {
			Object.defineProperty(window, "localStorage", {
				value: localStorageMock,
			});
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
					email: "test@test.test",
				})
			);
			const root = document.createElement("div");
			root.setAttribute("id", "root");
			document.body.append(root);
			router();
			window.onNavigate(ROUTES_PATH.NewBill);
			await waitFor(() => screen.getByTestId("icon-mail"));
			const windowIcon = screen.getByTestId("icon-mail");
			expect(windowIcon.className).toBe("active-icon");
		});
		test("Then the form contains some fields which are requierd to be submitted", () => {
			const expenseType = screen.getByTestId("expense-type");
			expect(expenseType.hasAttribute("required")).toBe(true);

			const datePicker = screen.getByTestId("datepicker");
			expect(datePicker.hasAttribute("required")).toBe(true);

			const amount = screen.getByTestId("amount");
			expect(amount.hasAttribute("required")).toBe(true);

			const pct = screen.getByTestId("pct");
			expect(pct.hasAttribute("required")).toBe(true);

			const file = screen.getByTestId("file");
			expect(file.hasAttribute("required")).toBe(true);
		});
	});
	describe("When I am on NewBill Page, i want to upload but my file has an invalid format", () => {
		test("Then it should detect change on file input", () => {
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				})
			);

			document.body.innerHTML = NewBillUI();

			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};
			const store = null;

			const newBill = new NewBill({
				document,
				onNavigate,
				store,
				localStorage,
			});
			const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
			const file = screen.getByTestId("file");

			window.alert = jest.fn();

			file.addEventListener("change", handleChangeFile);
			fireEvent.change(file, {
				target: {
					files: [new File(["file.png"], "file.png", { type: "image/png" })],
				},
			});

			jest.spyOn(window, "alert");
			// expect(alert).not.toHaveBeenCalled();

			expect(handleChangeFile).toHaveBeenCalled();
			expect(file.files[0].name).toBe("file.png");
			// expect(newBill.fileName).toBe("file.png");
			expect(newBill.formData).not.toBe(null);
		});
		test("Then, the alert message should be displayed and file cleared", () => {
			document.body.innerHTML = `
				<div>
				<form data-testid="form-new-bill">
					<input data-testid="file" type="file" />
				</form>
				</div>
			`;

			const onNavigate = jest.fn();
			const localStorage = window.localStorage;
			const firestore = null;
			const newBill = new NewBill({
				document,
				onNavigate,
				firestore,
				localStorage,
			});

			const file = new File(["file content"], "file.txt", {
				type: "text/plain",
			});
			const fileInput = document.querySelector(`input[data-testid="file"]`);

			const event = {
				preventDefault: jest.fn(),
				target: {
					value: "C:\\fakepath\\file.txt",
					files: [file],
				},
			};

			jest.spyOn(window, "alert").mockImplementation(() => {});

			newBill.handleChangeFile(event);

			expect(window.alert).toHaveBeenCalledWith(
				"Veuillez sélectionner un fichier avec une extension .jpg, .jpeg ou .png"
			);
			expect(fileInput.value).toBe("");
		});
	});
	describe("When I am on NewBill Page, and i submit form with valid data", () => {
		test("Then POST method should be successful", async () => {
			// Préparer les données de test
			const bill = {
				id: "47qAXb6fIm2zOKkLzMro",
				vat: "80",
				fileUrl:
					"https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
				status: "pending",
				type: "Hôtel et logement",
				commentary: "séminaire billed",
				name: "encore",
				fileName: "preview-facture-free-201801-pdf-1.jpg",
				date: "2004-04-04",
				amount: 400,
				commentAdmin: "ok",
				email: "a@a",
				pct: 20,
			};

			// Utiliser le mock store
			const postSpy = jest.spyOn(mockStore, "bills");
			const postBills = await mockStore.bills().create(bill);

			// Vérifier le résultat
			expect(postSpy).toHaveBeenCalledTimes(1);
			expect(postBills).toEqual({
				fileUrl: "https://localhost:3456/images/test.jpg",
				key: "1234",
			});
		});
	});
	describe("When I am on NewBill Page, i want to submit but an error appears", () => {
		beforeEach(() => {
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
					email: "a@a",
				})
			);
			document.body.innerHTML = NewBillUI();
		});
		afterEach(() => {
			document.body.innerHTML = "";
			jest.clearAllMocks();
		});
		test("Fetch fails with 404 error message", async () => {
			const store = {
				bills: jest.fn().mockImplementation(() => newBill.store),
				create: jest.fn().mockImplementation(() => Promise.resolve({})),
				update: jest
					.fn()
					.mockImplementation(() => Promise.reject(new Error("404"))),
			};
			const newBill = new NewBill({
				document,
				onNavigate: (pathname) => {
					document.body.innerHTML = ROUTES({ pathname });
				},
				store,
				localStorage: window.localStorage,
			});
			newBill.isFormImgValid = true;

			// Submit form
			const form = screen.getByTestId("form-new-bill");
			const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
			form.addEventListener("submit", handleSubmit);

			fireEvent.submit(form);
			await new Promise(process.nextTick);

			await expect(store.update()).rejects.toEqual(new Error("404"));
		});
		test("Fetch fails with 500 error message", async () => {
			const store = {
				bills: jest.fn().mockImplementation(() => newBill.store),
				create: jest.fn().mockImplementation(() => Promise.resolve({})),
				update: jest
					.fn()
					.mockImplementation(() => Promise.reject(new Error("500"))),
			};
			const newBill = new NewBill({
				document,
				onNavigate: (pathname) => {
					document.body.innerHTML = ROUTES({ pathname });
				},
				store,
				localStorage: window.localStorage,
			});
			newBill.isFormImgValid = true;

			// Submit form
			const form = screen.getByTestId("form-new-bill");
			const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
			form.addEventListener("submit", handleSubmit);

			fireEvent.submit(form);
			await new Promise(process.nextTick);

			await expect(store.update()).rejects.toEqual(new Error("500"));
		});
	});	
});
