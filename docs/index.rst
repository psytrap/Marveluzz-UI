PyWebIO
==========

PyWebIO provides a diverse set of imperative functions to obtain user input and output content on the browser,
turning the browser into a "rich text terminal", and can be used to build simple web applications or browser-based
GUI applications. Using PyWebIO, developers can write applications just like writing terminal scripts
(interaction based on input and print function), without the need to have knowledge of HTML and JS.
PyWebIO is ideal for quickly building interactive applications that don't require a complicated user interface.

Features
------------

- Use synchronization instead of callback-based method to get input
- Non-declarative layout, simple and efficient
- Less intrusive: old script code can be transformed into a Web service only by modifying the input and output operation
- Support integration into existing web services, currently supports Flask, Django, Tornado, aiohttp and FastAPI(Starlette) framework
- Support for ``asyncio`` and coroutine
- Support data visualization with third-party libraries

Installation
--------------

Stable version::

   pip3 install -U pywebio

Development version::

    pip3 install -U https://github.com/pywebio/PyWebIO/archive/dev-release.zip

**Prerequisites**: PyWebIO requires Python 3.5.2 or newer

.. _hello_word:

Hello, world
--------------

Here is a simple PyWebIO script to calculate the `BMI <https://en.wikipedia.org/wiki/Body_mass_index>`_ ::

    # A simple script to calculate BMI
    from pywebio.input import input, FLOAT
    from pywebio.output import put_text

    def bmi():
        height = input("Input your height(cm)：", type=FLOAT)
        weight = input("Input your weight(kg)：", type=FLOAT)

        BMI = weight / (height / 100) ** 2

        top_status = [(16, 'Severely underweight'), (18.5, 'Underweight'),
                      (25, 'Normal'), (30, 'Overweight'),
                      (35, 'Moderately obese'), (float('inf'), 'Severely obese')]

        for top, status in top_status:
            if BMI <= top:
                put_text('Your BMI: %.1f. Category: %s' % (BMI, status))
                break

    if __name__ == '__main__':
        bmi()

This is just a very simple script if you ignore PyWebIO, but after using the input and output functions provided by PyWebIO,
you can interact with the code in the browser:

.. image:: /assets/demo.*
   :width: 450px
   :align: center

In the last line of the above code, changing the function call ``bmi()`` to
`pywebio.start_server(bmi, port=80) <pywebio.platform.tornado.start_server>` will start a bmi web service on port 80
( :demo_host:`online Demo </bmi>` ).

If you want to integrate the ``bmi()`` service into an existing web framework, you can visit
:ref:`Integration with a web framework <integration_web_framework>` section of this document.

Documentation
-------------
This documentation is also available in `PDF and Epub formats <https://readthedocs.org/projects/pywebio/downloads/>`_.

.. toctree::
   :maxdepth: 2
   :caption: Manual

   guide
   input
   output
   session
   platform
   pin
   advanced
   libraries_support

.. toctree::
   :titlesonly:

   cookbook
   releases

.. toctree::
   :maxdepth: 2
   :caption: Battery

   battery

.. toctree::
   :maxdepth: 2
   :caption: Implement Doc

   spec

Indices and tables
----------------------

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`


Discussion and support
----------------------

* Need help when use PyWebIO? Make a new discussion on `Github Discussions <https://github.com/wang0618/PyWebIO/discussions>`_.

* Report bugs on the `GitHub issue <https://github.com/wang0618/pywebio/issues>`_.

