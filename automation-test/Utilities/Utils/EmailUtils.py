__author__ = 'hminh'
import smtplib
import tempfile
import zipfile
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


class Email(object):
    def __init__(self, from_email=None, user_name=None, password=None, email_domain=None, email_subject=None,
                 to_emails=[]):
        self.from_email = from_email
        self.email_user_name = user_name
        self.email_password = password
        self.email_domain = email_domain
        self.email_subject = email_subject
        self.list_to_email = to_emails

    __from_email = None
    __email_user = None
    __email_password = None
    __email_domain = None
    __email_subject = None
    __list_to_email = None

    @property
    def from_email(self):
        if self.__from_email is None:
            return "AutomationReport@domain.com"
        return self.__from_email

    @from_email.setter
    def from_email(self, from_email):
        self.__from_email = from_email

    @property
    def email_domain(self):
        if self.__email_domain is None:
            return "webmail.domain.com"
        return self.__email_domain

    @email_domain.setter
    def email_domain(self, email_domain):
        self.__email_domain = email_domain

    @property
    def email_user_name(self):
        return self.__email_user

    @email_user_name.setter
    def email_user_name(self, email):
        self.__email_user = email

    @property
    def email_password(self):
        return self.__email_password

    @email_password.setter
    def email_password(self, password):
        self.__email_password = password

    @property
    def email_subject(self):
        if self.__from_email is None:
            return "Automation Report"
        return self.__email_subject

    @email_subject.setter
    def email_subject(self, email_subject):
        self.__email_subject = email_subject

    @property
    def list_to_email(self):
        if len(self.__list_to_email) == 0:
            return ["hnminh@outlook.com"]
        return self.__list_to_email

    @list_to_email.setter
    def list_to_email(self, list_email):
        self.__list_to_email.extend(list_email.split(','))

    def send_anonymous_email(self, test_log):
        email_protocol = smtplib.SMTP(self.email_domain)
        email_protocol.sendmail(self.from_email, self.list_to_email,
                                self.create_email_message(test_log).as_string())

    def send_anonymous_email_with_attachment(self, test_log, attachment_path, attachment_name):
        email_protocol = smtplib.SMTP(self.email_domain)
        email_protocol.sendmail(self.from_email, self.list_to_email,
                                self.create_email_message_with_attachment(test_log, attachment_path,
                                                                          attachment_name).as_string())

    def send_email(self, test_log):
        raise NotImplementedError("Send Email With Credential Not implemented error")

    def send_email_with_attachment(self, test_log, attachment_path, attachment_name):
        raise NotImplementedError("Send Email Include Attachment With Credential Not implemented error")

    def create_email_message(self, email_body):
        email_message = MIMEMultipart('alternative')
        email_message['Subject'] = self.email_subject
        email_message['From'] = self.from_email
        email_message['To'] = ','.join(set(self.list_to_email))
        email_message.attach(MIMEText(email_body, 'html'))
        return email_message

    def create_email_message_with_attachment(self, email_body, attachment_path, attachment_name):
        email_message = MIMEMultipart('alternative')
        email_message['Subject'] = self.email_subject
        email_message['From'] = self.from_email
        email_message['To'] = ','.join(set(self.list_to_email))
        email_message.attach(MIMEText(email_body, 'html'))
        email_message.attach(self.create_attachment_message(attachment_path, attachment_name))
        return email_message

    def create_attachment_message(self, attachment_path, attachment_name):
        zip_file = tempfile.TemporaryFile(prefix='mail', suffix='.zip')
        zip_action = zipfile.ZipFile(zip_file, 'w')
        zip_action.write(attachment_path)
        zip_action.close()
        zip_file.seek(0)
        attachment_message = MIMEBase('application', 'zip')
        attachment_message.set_payload(zip_file.read())
        encoders.encode_base64(attachment_message)
        attachment_message.add_header('Content-Disposition', 'attachment', filename=attachment_name + '.zip')
        return attachment_message
