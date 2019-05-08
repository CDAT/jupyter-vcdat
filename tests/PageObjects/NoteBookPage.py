from MainPageLocator import MainPageLocator


class NoteBookPage(MainPageLocator):
    def __init__(self, driver, server=None):
        super(NoteBookPage, self).__init__(driver, server)

    def _validate_page(self):
        print("...NoteBookPage.validatePage()")
        # no op for now

    def new_notebook(self, launcher_title):
        print("...new_notebook...")
        self.click_on_new_launcher_icon()
        self.select_notebook_launcher(launcher_title)

    def rename_notebook(self, new_nb_name):
        self.click_on_top_menu_item("File")
