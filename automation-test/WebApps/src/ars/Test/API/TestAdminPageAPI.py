__author__ = "mh"
from django.test import TestCase
from django.core.urlresolvers import reverse


class TestHomePageAPI(TestCase):

    def test_uses_index_template(self):
        try:
            print(reverse('admin'))
        except Exception as e:
            print (e)
        response = self.client.get("/admin")
        print (response)
        #self.assertTemplateUsed(response, 'ars/index.html')

