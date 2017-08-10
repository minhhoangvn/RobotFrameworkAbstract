__author__ = "mh"
from django.test import TestCase
from django.core.urlresolvers import reverse
from django.utils.translation import activate

class TestHomePageAPI(TestCase):

    def test_uses_index_template(self):
        activate('vi')
        response = self.client.get(reverse("home"))
        self.assertTemplateUsed(response, 'ars/index.html')

    def test_uses_base_template(self):
        activate('vi')
        response = self.client.get(reverse("home"))
        self.assertTemplateUsed(response, 'base.html')
