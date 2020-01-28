class Locator:
    def __init__(self, page, parent, loc, loc_type, descr=""):
        self.page = page
        self.parent = parent
        self.locator = loc
        self.locator_type = loc_type
        self.description = descr
        self.element = None

    def click(self):
        # Attempt to find the element
        self.element = self.page.find_element(self.locator, self.locator_type)
        if self.element is not None:
            # Element found, click it
            if self.description != "":
                print("{} found!".format(self.description))
            else:
                print("Element found!")
            self.page.move_to_click(self.element)
            return
        elif self.parent is not None:
            # Try to click parent first
            self.parent.click()
            self.element = self.page.find_element(
                self.locator, self.locator_type)
            if self.element is not None:
                # Element found, click it
                if self.parent.description != "":
                    print("Parent element {} found!".format(self.description))
                else:
                    print("Parent element found!")
                self.page.move_to_click(self.element)
                return
        if self.description != "":
            print("{} could not be found.".format(self.description))
        else:
            print("Element could not be found.")
